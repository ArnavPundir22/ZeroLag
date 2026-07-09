import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDatabase, resetDatabase } from './database';
import { useAppStore } from '../store';
import { useUser } from '@clerk/react';

import { AlertCircle, RefreshCw } from 'lucide-react';

const DatabaseContext = createContext<any>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode, offlineUserId?: string }> = ({ children, offlineUserId }) => {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const setCurrentBoardId = useAppStore(state => state.setCurrentBoardId);
  const { user } = useUser();

  useEffect(() => {
    let mounted = true;
    const activeUserId = user?.id || offlineUserId;
    
    if (!activeUserId) {
      setDb(null);
      resetDatabase();
      return;
    }

    const initDB = async () => {
      try {
        setDbError(null);
        const database = await getDatabase(activeUserId);
        if (mounted) {
          setDb(database);
          
          // Set initial board if none selected
          const boards = await database.boards.find().exec();
          if (boards.length > 0) {
            setCurrentBoardId(boards[0].id);
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to initialize database', err);
        if (mounted) {
          setDbError(err.message || 'Unknown database error occurred');
          setLoading(false);
        }
      }
    };
    initDB();
    return () => {
      mounted = false;
    };
  }, [setCurrentBoardId, user?.id, offlineUserId]);

  const handleReset = () => {
    resetDatabase();
    window.location.reload();
  };

  if (dbError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-surface-base border border-surface-border rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-text-primary">Database Error</h2>
            <p className="text-text-secondary text-sm">Failed to initialize local storage. This might be due to corrupted data or browser storage limits.</p>
          </div>
          <div className="bg-background/50 p-4 rounded-xl border border-surface-border text-left">
            <p className="text-red-400 font-mono text-xs break-all">{dbError}</p>
          </div>
          <button onClick={handleReset} className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl border border-red-500/20 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Reset Local Data & Reload</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background text-text-secondary">Loading local database...</div>;
  }

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
