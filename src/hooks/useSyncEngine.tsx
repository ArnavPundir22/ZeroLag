import React, { useEffect, useRef, createContext, useContext } from 'react';
import { useDatabase } from '../db/DatabaseProvider';
import { useAppStore } from '../store';
import { useUser, useSession } from '@clerk/react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let lastNotificationTime = 0;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const playNotificationSound = () => {
  const now = Date.now();
  if (now - lastNotificationTime < 2000) return; // Throttle to once every 2 seconds
  lastNotificationTime = now;

  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.error('Failed to play notification sound', err);
  }
};


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

        const { _rev, _deleted, _attachments, _meta, _authorName, ...cleanData } = payloadData;

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
        const supabase = createClient(supabaseUrl, supabaseKey, {
          accessToken: async () => {
            const t = await session.getToken({ template: 'supabase' });
            if (!t) console.warn('[SYNC] Could not get Supabase JWT from Clerk.');
            return t || '';
          },
        });

        if (!mounted) return;
        supabaseRef.current = supabase;
        console.log('[SYNC] Connected to Supabase serverless database');

        // Fetch missed operations
        const lastSync = localStorage.getItem('last_sync_timestamp') || '0';

        // Get all boards the user has access to from Supabase
        const { data: accessData, error: accessError } = await supabase
          .from('board_access')
          .select('board_id')
          .eq('user_id', user.id);

        let remoteBoardIds: string[] = [];
        if (!accessError && accessData) {
           remoteBoardIds = accessData.map(a => a.board_id);
        }

        // Get all local boards
        const boards = await db.boards.find().exec();
        const localBoardIds = boards.map((b: any) => b.id);
        
        const allBoardIds = Array.from(new Set([...remoteBoardIds, ...localBoardIds]));

        if (allBoardIds.length > 0) {
          const { data: operations, error } = await supabase
            .from('operations')
            .select('*')
            .in('board_id', allBoardIds)
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
            
            let localOps: string[] = [];
            try {
              localOps = JSON.parse(localStorage.getItem('zerolag_local_ops') || '[]');
            } catch (e) {
              console.warn('[SYNC] Failed to parse local ops', e);
            }
            const isLocal = localOps.includes(op.id);
            
            if (op.board_id && currentBoardIds.includes(op.board_id)) {
              await handleRemoteOperation(op);
              localStorage.setItem('last_sync_timestamp', op.timestamp);
              
              if (!isLocal) {
                const state = useAppStore.getState();
                if (state.notificationsEnabled) {
                  playNotificationSound();
                  
                  const parsedPayload = typeof op.payload === 'string' ? JSON.parse(op.payload) : (op.payload || {});
                  const author = parsedPayload._authorName || 'A collaborator';
                  
                  let actionVerb = 'made changes to';
                  if (op.type === 'CREATE') actionVerb = 'added a new';
                  else if (op.type === 'UPDATE') actionVerb = 'updated a';
                  else if (op.type === 'DELETE') actionVerb = 'deleted a';
                  
                  let entityName = 'item';
                  if (op.entity === 'TASKS') entityName = 'task';
                  else if (op.entity === 'BOARDS') entityName = 'board';
                  else if (op.entity === 'COLUMNS') entityName = 'column';
                  else if (op.entity === 'COMMENTS') entityName = 'comment';
                  
                  const message = `${author} ${actionVerb} ${entityName}. If you can't see the changes, please refresh the app so that the changes can be synced.`;
                  
                  state.setGlobalToastMessage(message);
                }
              }
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

  const isSyncingRef = useRef(false);

  const syncOperations = async () => {
    if (isOffline || !db || !supabaseRef.current || isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      setSyncStatus('syncing');

      const pendingOps = await db.operations.find({
        selector: { status: 'PENDING' }
      }).exec();

      if (pendingOps.length === 0) {
        setSyncStatus('idle');
        isSyncingRef.current = false;
        return;
      }

      const payload = pendingOps.map((op: any) => {
        const parsedPayload = (typeof op.payload === 'string' && op.payload.trim()) ? JSON.parse(op.payload) : (op.payload || {});
        parsedPayload._authorName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'A collaborator';
        
        return {
          id: op.id,
          board_id: op.boardId || 'unknown',
          type: op.type,
          entity: op.entity,
          entity_id: op.entityId,
          payload: parsedPayload,
          timestamp: op.timestamp
        };
      }).filter((op: any) => op.board_id !== 'unknown');

      if (payload.length === 0) {
        // Mark pending ops as synced locally even if they were skipped, to prevent endless loop
        for (const op of pendingOps) {
          const doc = await db.operations.findOne({ selector: { id: op.id } }).exec();
          if (doc) await doc.patch({ status: 'SYNCED' });
        }
        isSyncingRef.current = false;
        return;
      }

      // If CREATE BOARD, we must insert into board_access FIRST so RLS allows the operations
      const boardCreateOps = pendingOps.filter((op: any) => op.entity === 'BOARDS' && op.type === 'CREATE');
      for (const op of boardCreateOps) {
        // Use insert instead of upsert to avoid RLS SELECT check failures for new boards
        const { error: boardErr } = await supabaseRef.current.from('boards').insert({ id: op.entityId });
        if (boardErr && boardErr.code !== '23505') console.error('[SYNC] Failed to insert board:', boardErr);

        const { error: accessErr } = await supabaseRef.current.from('board_access').insert({ board_id: op.entityId, user_id: user?.id });
        if (accessErr && accessErr.code !== '23505') console.error('[SYNC] Failed to insert board_access:', accessErr);
      }

      // Check which operations already exist to avoid unique constraint violations
      const opIds = payload.map((p: any) => p.id);
      const { data: existingOps, error: checkError } = await supabaseRef.current
        .from('operations')
        .select('id')
        .in('id', opIds);

      if (checkError) {
        console.error('[SYNC] Failed to check existing operations:', checkError);
        setSyncStatus('error');
        isSyncingRef.current = false;
        return;
      }

      const existingIds = new Set(existingOps?.map(op => op.id) || []);
      const newOps = payload.filter((p: any) => !existingIds.has(p.id));

      if (newOps.length > 0) {
        // Send operations to Supabase
        const { error: insertError } = await supabaseRef.current
          .from('operations')
          .insert(newOps);

        if (insertError) {
          console.error('[SYNC] Failed to insert operations to Supabase:', insertError);
          console.error('[SYNC] Payload that failed:', JSON.stringify(newOps, null, 2));
          setSyncStatus('error');
          isSyncingRef.current = false;
          return;
        }
        
        // Track locally created ops to prevent notifying ourselves
        try {
          const localOps = JSON.parse(localStorage.getItem('zerolag_local_ops') || '[]');
          const updatedLocalOps = [...localOps, ...newOps.map((o: any) => o.id)].slice(-200);
          localStorage.setItem('zerolag_local_ops', JSON.stringify(updatedLocalOps));
        } catch (e) {
          console.warn('[SYNC] Failed to track local ops', e);
        }
      }

      // Remove synced ops locally (both the new ones we just inserted and the ones that already existed)
      const opsToDeleteIds = pendingOps.map((op: any) => op.id);
      await db.operations.bulkRemove(opsToDeleteIds);

      // If DELETE BOARD, remove access so new devices don't fetch its history
      const boardDeleteOps = pendingOps.filter((op: any) => op.entity === 'BOARDS' && op.type === 'DELETE');
      for (const op of boardDeleteOps) {
        const { error: accessErr } = await supabaseRef.current.from('board_access')
          .delete()
          .eq('board_id', op.entityId)
          .eq('user_id', user?.id);
        if (accessErr) console.error('[SYNC] Failed to remove board_access:', accessErr);
      }

      setSyncStatus('idle');

    } catch (err: any) {
      console.error('[SYNC] Sync error:', err);
      setSyncStatus('error');
    } finally {
      isSyncingRef.current = false;
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
      const { error: upsertError } = await supabaseRef.current.from('board_access').upsert({ board_id: boardId, user_id: user?.id });
      if (upsertError) {
        console.error('[SYNC] Failed to upsert board_access:', upsertError);
      }

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
