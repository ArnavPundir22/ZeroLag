import React, { useEffect, useRef, createContext, useContext } from 'react';
import { useDatabase } from '../db/DatabaseProvider';
import { useAppStore } from '../store';
import { useUser, useSession } from '@clerk/react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SyncContextType {
  isOffline: boolean;
  joinRemoteBoard: (boardId: string) => Promise<boolean>;
}

const SyncContext = createContext<SyncContextType | null>(null);

export const useSyncContext = () => {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSyncContext must be used within SyncProvider');
  return ctx;
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useDatabase();
  const { user } = useUser();
  const { session } = useSession();
  const isOffline = useAppStore(state => state.isOffline);
  const setSyncStatus = useAppStore(state => state.setSyncStatus);
  const syncTimeoutRef = useRef<any>(null);
  
  // Hold the authenticated supabase instance
  const supabaseRef = useRef<SupabaseClient | null>(null);
  // Track active channels so we can unsubscribe if needed
  const channelRef = useRef<any>(null);

  const handleRemoteOperation = async (op: any) => {
    if (!db) return;
    console.log('[SYNC] Received remote operation:', op);
    
    const collectionName = op.entity.toLowerCase();
    const collection = (db as any)[collectionName];

    if (!collection) {
      console.warn('[SYNC] Unknown entity collection:', collectionName);
      return;
    }

    try {
      (window as any).__isRemoteSync = true;

      if (op.type === 'DELETE') {
        const doc = await collection.findOne({ selector: { id: op.entity_id || op.entityId } }).exec();
        if (doc) await doc.remove();
      } else {
        // CREATE or UPDATE
        const payloadData = typeof op.payload === 'string' ? JSON.parse(op.payload) : op.payload;
        const entityId = op.entity_id || op.entityId || payloadData.id;
        const doc = await collection.findOne({ selector: { id: entityId } }).exec();
        
        const { _rev, _deleted, _attachments, _meta, ...cleanData } = payloadData;

        if (doc) {
          await doc.patch(cleanData);
        } else {
          await collection.insert(cleanData);
        }
      }
    } catch (err) {
      console.error('[SYNC] Failed to apply remote operation:', err);
    } finally {
      (window as any).__isRemoteSync = false;
    }
  };

  useEffect(() => {
    if (!db || !user?.id || !session) return;

    let mounted = true;

    const initSupabase = async () => {
      try {
        const token = await session.getToken({ template: 'supabase' });
        if (!token) {
          console.warn('[SYNC] Could not get Supabase JWT from Clerk. Ensure you created the JWT template.');
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });

        if (!mounted) return;
        supabaseRef.current = supabase;
        console.log('[SYNC] Connected to Supabase serverless database');

        // Fetch missed operations
        const lastSync = localStorage.getItem('last_sync_timestamp') || '0';
        
        // Get all local boards to filter
        const boards = await db.boards.find().exec();
        const boardIds = boards.map((b: any) => b.id);
        
        if (boardIds.length > 0) {
          const { data: operations, error } = await supabase
            .from('operations')
            .select('*')
            .in('board_id', boardIds)
            .gt('timestamp', lastSync)
            .order('timestamp', { ascending: true });

          if (error) {
            console.error('[SYNC] Failed to fetch operations:', error);
          } else if (operations && operations.length > 0) {
            console.log(`[SYNC] Fetched ${operations.length} missed operations`);
            for (const op of operations) {
              await handleRemoteOperation(op);
              localStorage.setItem('last_sync_timestamp', op.timestamp);
            }
          }
        }

        if (!isOffline) {
          syncOperations();
        }

        // Subscribe to real-time changes
        channelRef.current = supabase.channel('public:operations')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'operations' }, async (payload) => {
            const op = payload.new;
            // Only process if it belongs to a board we know about
            const currentBoards = await db.boards.find().exec();
            const currentBoardIds = currentBoards.map((b: any) => b.id);
            if (op.board_id && currentBoardIds.includes(op.board_id)) {
              await handleRemoteOperation(op);
              localStorage.setItem('last_sync_timestamp', op.timestamp);
            }
          })
          .subscribe();
          
      } catch (err) {
        console.error('[SYNC] Initialization error:', err);
      }
    };

    initSupabase();

    return () => {
      mounted = false;
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
    };
  }, [isOffline, db, user?.id, session]);

  const syncOperations = async () => {
    if (isOffline || !db || !supabaseRef.current) return;
    
    try {
      setSyncStatus('syncing');
      
      const pendingOps = await db.operations.find({
        selector: { status: 'PENDING' }
      }).exec();

      if (pendingOps.length === 0) {
        setSyncStatus('idle');
        return;
      }

      const payload = pendingOps.map((op: any) => ({
        id: op.id,
        board_id: op.boardId || 'unknown',
        type: op.type,
        entity: op.entity,
        entity_id: op.entityId,
        payload: op.payload,
        timestamp: op.timestamp
      }));

      // If CREATE BOARD, we must insert into board_access FIRST so RLS allows the operations
      const boardCreateOps = pendingOps.filter((op: any) => op.entity === 'BOARDS' && op.type === 'CREATE');
      for (const op of boardCreateOps) {
        await supabaseRef.current.from('boards').upsert({ id: op.entityId });
        await supabaseRef.current.from('board_access').upsert({ board_id: op.entityId, user_id: user?.id });
      }

      // Send operations to Supabase
      const { error } = await supabaseRef.current
        .from('operations')
        .insert(payload);

      if (error) {
        console.error('[SYNC] Failed to insert operations to Supabase:', error);
        setSyncStatus('error');
        return;
      }

      // Remove synced ops locally
      const opsToDeleteIds = pendingOps.map((op: any) => op.id);
      await db.operations.bulkRemove(opsToDeleteIds);
      
      setSyncStatus('idle');

    } catch (err) {
      console.error('[SYNC] Sync error:', err);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    if (!db) return;

    // Listen to local changes to push to server
    const sub = db.operations.$.subscribe(() => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(syncOperations, 1000);
    });

    return () => {
      sub.unsubscribe();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [db, isOffline]);

  const joinRemoteBoard = async (boardId: string): Promise<boolean> => {
    if (!supabaseRef.current || !db) return false;
    
    try {
      // Add ourselves to board_access if not already there
      // We assume if they have the ID, they have the invite link
      await supabaseRef.current.from('board_access').upsert({ board_id: boardId, user_id: user?.id });

      const { data: operations, error } = await supabaseRef.current
        .from('operations')
        .select('*')
        .eq('board_id', boardId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (operations && operations.length > 0) {
        console.log(`[SYNC] Replaying ${operations.length} operations for board ${boardId}`);
        for (const op of operations) {
          await handleRemoteOperation(op);
        }
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[SYNC] Failed to join remote board:', err);
      return false;
    }
  };

  return (
    <SyncContext.Provider value={{ isOffline, joinRemoteBoard }}>
      {children}
    </SyncContext.Provider>
  );
};
