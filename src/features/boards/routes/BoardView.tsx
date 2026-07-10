import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useDatabase } from '../../../db/DatabaseProvider';
import { useAppStore } from '../../../store';
import { Board } from '../components/Board';
import { useClerk, useUser } from '@clerk/react';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
import { LiveCursors } from '../components/LiveCursors';
import { CalendarView } from '../components/CalendarView';
import { BoardHeader } from '../components/BoardHeader';

export const BoardRouteWrapper = () => {
  const { boardId } = useParams();
  const setCurrentBoardId = useAppStore(state => state.setCurrentBoardId);
  
  useEffect(() => {
    if (boardId) {
      setCurrentBoardId(boardId);
    }
  }, [boardId, setCurrentBoardId]);

  return <BoardView />;
};

export const BoardView = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const currentBoardId = useAppStore(state => state.currentBoardId);
  const isOffline = useAppStore(state => state.isOffline);
  const syncStatus = useAppStore(state => state.syncStatus);
  const filterPriorities = useAppStore(state => state.filterPriorities);
  const setFilterPriorities = useAppStore(state => state.setFilterPriorities);
  const filterLabels = useAppStore(state => state.filterLabels);
  const setFilterLabels = useAppStore(state => state.setFilterLabels);
  const setIsSidebarOpen = useAppStore(state => state.setIsSidebarOpen);
  
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board');
  
  const db = useDatabase();
  const [boardTitle, setBoardTitle] = useState('Board');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  const { onlineUsers } = useMultiplayer();

  useEffect(() => {
    if (!db || !currentBoardId) return;
    const sub = db.boards.findOne({ selector: { id: currentBoardId } }).$.subscribe((doc: any) => {
      if (doc) {
        setBoardTitle(doc.title);
      }
    });
    return () => sub.unsubscribe();
  }, [db, currentBoardId]);

  // Fetch available labels
  useEffect(() => {
    if (!db) return;
    const sub = db.tasks.find().$.subscribe((tsks: any[]) => {
      const labels = new Set<string>();
      tsks.forEach((t: any) => {
        if (t.labels && Array.isArray(t.labels)) {
          t.labels.forEach((l: string) => labels.add(l));
        }
      });
      setAvailableLabels(Array.from(labels).sort());
    });
    return () => sub.unsubscribe();
  }, [db]);


  const togglePriorityFilter = (priority: string) => {
    if (filterPriorities.includes(priority)) {
      setFilterPriorities(filterPriorities.filter(p => p !== priority));
    } else {
      setFilterPriorities([...filterPriorities, priority]);
    }
  };

  const toggleLabelFilter = (label: string) => {
    if (filterLabels.includes(label)) {
      setFilterLabels(filterLabels.filter(l => l !== label));
    } else {
      setFilterLabels([...filterLabels, label]);
    }
  };

  const handleShare = async () => {
    if (!currentBoardId) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentBoardId);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = currentBoardId;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
      }
      setToastMessage('Project code copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleRenameSubmit = async () => {
    if (!db || !currentBoardId || !tempTitle.trim() || tempTitle.trim() === boardTitle) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const doc = await db.boards.findOne({ selector: { id: currentBoardId } }).exec();
      if (doc) {
        await doc.patch({ 
          title: tempTitle.trim(),
          updatedAt: new Date().toISOString()
        });
        setToastMessage('Project renamed');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to rename board', error);
      setToastMessage('Failed to rename project');
      setTimeout(() => setToastMessage(null), 3000);
    }
    setIsEditingTitle(false);
  };

  const handleMeetClick = () => {
    if (!currentBoardId) return;
    
    // Connect to the deterministic meeting room using a GET request for PWA compatibility
    // The deployed server needs the updated /meet endpoint for this to work perfectly.
    const baseUrl = 'https://baatcheet-88e9.onrender.com/meet';
    const roomCode = currentBoardId.substring(0, 6).toUpperCase();
    const username = user?.fullName || user?.firstName || 'ZeroLag User';
    
    const params = new URLSearchParams({
      action: 'create',
      room_code: roomCode,
      room_name: boardTitle,
      username: username
    });
    
    window.open(`${baseUrl}?${params.toString()}`, '_blank');
  };

  return (
    <main className="flex-1 overflow-hidden flex flex-col relative min-w-0 min-h-0">
      <LiveCursors onlineUsers={onlineUsers} />

      <BoardHeader 
        boardTitle={boardTitle}
        tempTitle={tempTitle}
        setTempTitle={setTempTitle}
        isEditingTitle={isEditingTitle}
        setIsEditingTitle={setIsEditingTitle}
        handleRenameSubmit={handleRenameSubmit}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filterPriorities={filterPriorities}
        togglePriorityFilter={togglePriorityFilter}
        filterLabels={filterLabels}
        availableLabels={availableLabels}
        toggleLabelFilter={toggleLabelFilter}
        user={user}
        onlineUsers={onlineUsers}
        isOffline={isOffline}
        syncStatus={syncStatus}
        handleMeetClick={handleMeetClick}
        handleShare={handleShare}
        signOut={signOut}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {viewMode === 'board' ? <Board /> : <CalendarView />}

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-xl rounded-lg px-4 py-3 z-[60] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-text-primary">{toastMessage}</span>
        </div>
      )}
    </main>
  );
};
