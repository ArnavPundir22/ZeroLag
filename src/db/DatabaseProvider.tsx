import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDatabase, resetDatabase } from './database';
import { useAppStore } from '../store';
import { useUser } from '@clerk/react';

const DatabaseContext = createContext<any>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode, offlineUserId?: string }> = ({ children, offlineUserId }) => {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      } catch (err) {
        console.error('Failed to initialize database', err);
      }
    };
    initDB();
    return () => {
      mounted = false;
    };
  }, [setCurrentBoardId, user?.id, offlineUserId]);

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
