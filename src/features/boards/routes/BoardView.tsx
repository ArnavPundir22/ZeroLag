import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Menu, RefreshCw, AlertTriangle, CheckCircle2, Share2, LogOut, Calendar as CalendarIcon, Layout, Video } from 'lucide-react';
import { useDatabase } from '../../../db/DatabaseProvider';
import { useAppStore } from '../../../store';
import { Board } from '../components/Board';
import { useClerk, useUser } from '@clerk/react';
import { useMultiplayer } from '../../../hooks/useMultiplayer';
import { LiveCursors } from '../components/LiveCursors';
import { CalendarView } from '../components/CalendarView';

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
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

      <header className="flex flex-col sm:flex-row sm:h-14 sm:items-center justify-between shrink-0 bg-background/80 backdrop-blur-md z-10 relative border-b border-border">
        {/* Top Row: Title, Menu, and basic status */}
        <div className="flex items-center justify-between h-14 px-3 sm:px-8 w-full sm:w-auto">
          <div className="flex items-center gap-1 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-text-secondary hover:text-text-primary rounded-md hover:bg-surface-hover flex items-center justify-center min-w-[32px]"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {isEditingTitle ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="font-medium text-text-primary bg-background border border-accent rounded px-2 py-0.5 max-w-[120px] sm:max-w-[200px] md:max-w-xs leading-none outline-none focus:ring-2 focus:ring-accent/50"
              />
            ) : (
              <h2 
                onClick={() => {
                  setTempTitle(boardTitle);
                  setIsEditingTitle(true);
                }}
                title="Click to rename"
                className="font-medium text-text-primary truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs leading-none cursor-pointer hover:bg-surface-hover hover:ring-1 hover:ring-border px-2 py-1 rounded transition-all"
              >
                {boardTitle}
              </h2>
            )}

            <div className="hidden sm:block h-4 w-px bg-border mx-2" />

            {/* Desktop View Switcher & Filter (hidden on mobile, moved to bottom row) */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex p-1 bg-black/20 border border-white/5 rounded-lg mr-2">
                <button
                  onClick={() => setViewMode('board')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${viewMode === 'board' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
                >
                  <Layout className="w-3.5 h-3.5" /> Board
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" /> Calendar
                </button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center justify-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors min-h-[36px] ${(filterPriorities.length > 0 || filterLabels.length > 0) ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                >
                  <span>Filter</span>
                  {(filterPriorities.length > 0 || filterLabels.length > 0) && (
                    <span className="bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {filterPriorities.length + filterLabels.length}
                    </span>
                  )}
                </button>
                
                {isFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 py-2">
                      <div className="px-3 py-1 text-xs font-medium text-text-secondary uppercase tracking-wider">Priority</div>
                      {['urgent', 'high', 'normal', 'low'].map(p => (
                        <button 
                          key={p}
                          onClick={() => togglePriorityFilter(p)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover transition-colors"
                        >
                          <div className={`w-3 h-3 rounded border ${filterPriorities.includes(p) ? 'bg-accent border-accent' : 'border-border'}`} />
                          <span className="capitalize">{p}</span>
                        </button>
                      ))}

                      {availableLabels.length > 0 && (
                        <>
                          <div className="px-3 py-1 mt-2 border-t border-border/50 pt-2 text-xs font-medium text-text-secondary uppercase tracking-wider">Labels</div>
                          {availableLabels.map(l => (
                            <button 
                              key={l}
                              onClick={() => toggleLabelFilter(l)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover transition-colors"
                            >
                              <div className={`w-3 h-3 rounded border flex-shrink-0 ${filterLabels.includes(l) ? 'bg-accent border-accent' : 'border-border'}`} />
                              <span className="truncate">{l}</span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-4 text-sm relative">
            {/* Desktop Avatars */}
            <div className="hidden md:flex items-center -space-x-2 mr-2">
              {user && (
                <div 
                  title={`${user.fullName || user.firstName || 'You'} (You)`}
                  className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-xs font-bold text-white shadow-md relative group z-30 bg-accent"
                >
                  {user.imageUrl ? (
                    <img src={user.imageUrl} alt="You" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (user.fullName || user.firstName || 'Y').substring(0, 2).toUpperCase()
                  )}
                </div>
              )}
              {Object.values(onlineUsers).slice(0, 4).map(u => (
                <div 
                  key={u.id} 
                  title={u.name}
                  className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-xs font-bold text-white shadow-md relative group z-20"
                  style={{ backgroundColor: u.color }}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    u.name.substring(0, 2).toUpperCase()
                  )}
                </div>
              ))}
              {Object.values(onlineUsers).length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-hover flex items-center justify-center text-[10px] font-bold text-text-secondary z-10">
                  +{Object.values(onlineUsers).length - 4}
                </div>
              )}
            </div>

            <div className={`flex items-center justify-center sm:justify-start gap-2 p-1.5 sm:px-3 sm:py-1.5 min-w-[32px] sm:min-w-[auto] min-h-[32px] sm:min-h-[36px] rounded-full border transition-colors ${
              isOffline 
                ? 'border-orange-500/30 text-orange-400 bg-orange-500/10' 
                : syncStatus === 'syncing'
                  ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                  : syncStatus === 'error'
                    ? 'border-red-500/30 text-red-400 bg-red-500/10'
                    : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
            }`}>
              {isOffline ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <span className="hidden sm:inline">Offline</span>
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Syncing</span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="hidden sm:inline">Error</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Synced</span>
                </>
              )}
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleMeetClick}
                className="flex items-center justify-center min-w-[36px] min-h-[36px] gap-2 px-3 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Start Video Meeting"
              >
                <Video className="w-4 h-4" />
                <span className="font-medium">Meet</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center min-w-[36px] min-h-[36px] gap-2 px-3 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                title="Refresh App"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-medium">Refresh</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center justify-center min-w-[36px] min-h-[36px] gap-2 px-3 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
                title="Share Project"
              >
                <Share2 className="w-4 h-4" />
                <span className="font-medium">Share</span>
              </button>
              <button 
                onClick={() => signOut()}
                className="flex items-center justify-center min-w-[36px] min-h-[36px] gap-2 px-3 rounded-lg border border-border text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Secondary Row: Tools & Actions */}
        <div className="sm:hidden flex items-center justify-between px-3 pb-3 gap-2 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex p-1 bg-black/20 border border-white/5 rounded-lg">
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'board' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
              >
                <Layout className="w-3.5 h-3.5" /> Board
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-surface text-white shadow' : 'text-text-secondary hover:text-white'}`}
              >
                <CalendarIcon className="w-3.5 h-3.5" /> Calendar
              </button>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors min-h-[32px] ${(filterPriorities.length > 0 || filterLabels.length > 0) ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
              >
                <span>Filter</span>
                {(filterPriorities.length > 0 || filterLabels.length > 0) && (
                  <span className="bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {filterPriorities.length + filterLabels.length}
                  </span>
                )}
              </button>
              
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 py-2">
                    <div className="px-3 py-1 text-xs font-medium text-text-secondary uppercase tracking-wider">Priority</div>
                    {['urgent', 'high', 'normal', 'low'].map(p => (
                      <button 
                        key={p}
                        onClick={() => togglePriorityFilter(p)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover transition-colors"
                      >
                        <div className={`w-3 h-3 rounded border ${filterPriorities.includes(p) ? 'bg-accent border-accent' : 'border-border'}`} />
                        <span className="capitalize">{p}</span>
                      </button>
                    ))}

                    {availableLabels.length > 0 && (
                      <>
                        <div className="px-3 py-1 mt-2 border-t border-border/50 pt-2 text-xs font-medium text-text-secondary uppercase tracking-wider">Labels</div>
                        {availableLabels.map(l => (
                          <button 
                            key={l}
                            onClick={() => toggleLabelFilter(l)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover transition-colors"
                          >
                            <div className={`w-3 h-3 rounded border flex-shrink-0 ${filterLabels.includes(l) ? 'bg-accent border-accent' : 'border-border'}`} />
                            <span className="truncate">{l}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              onClick={handleMeetClick}
              className="flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
              title="Start Video Meeting"
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
              title="Refresh App"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
              title="Share Project"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => signOut()}
              className="flex items-center justify-center min-w-[32px] min-h-[32px] p-1.5 rounded-lg border border-border text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'board' ? <Board /> : <CalendarView />}

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-xl rounded-lg px-4 py-3 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-text-primary">{toastMessage}</span>
        </div>
      )}
    </main>
  );
};
