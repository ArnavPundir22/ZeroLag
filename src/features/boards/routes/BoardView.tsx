import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Menu, RefreshCw, AlertTriangle, CheckCircle2, Share2 } from 'lucide-react';
import { useDatabase } from '../../../db/DatabaseProvider';
import { useAppStore } from '../../../store';
import { Board } from '../components/Board';

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
  
  const db = useDatabase();
  const [boardTitle, setBoardTitle] = useState('Board');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !currentBoardId) return;
    const sub = db.boards.findOne({ selector: { id: currentBoardId } }).$.subscribe((doc: any) => {
      if (doc) setBoardTitle(doc.title);
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

  return (
    <main className="flex-1 overflow-hidden flex flex-col relative min-w-0 min-h-0">
      <header className="h-14 border-b border-border flex items-center justify-between px-3 sm:px-8 shrink-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-1 sm:gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-1.5 -ml-1.5 text-text-secondary hover:text-text-primary rounded-md hover:bg-surface-hover flex items-center justify-center min-w-[32px]"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h2 className="font-medium text-text-primary truncate max-w-[90px] sm:max-w-[200px] md:max-w-xs">
            {boardTitle}
          </h2>
          
          <div className="hidden sm:block h-4 w-px bg-border mx-2" />
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-sm p-1.5 sm:px-3 sm:py-1.5 rounded-lg border transition-colors min-w-[32px] min-h-[32px] sm:min-h-[36px] ${(filterPriorities.length > 0 || filterLabels.length > 0) ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
            >
              <span className="hidden sm:inline">Filter</span>
              <span className="sm:hidden text-xs font-medium tracking-wide">Filter</span>
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
        
        <div className="flex items-center gap-1 sm:gap-4 text-sm">
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
                <span className="hidden sm:inline">Offline Mode</span>
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Syncing</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Sync Error</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Synced</span>
              </>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] gap-2 p-1.5 sm:px-3 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            title="Refresh App"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Refresh</span>
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] gap-2 p-1.5 sm:px-3 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
            title="Share Project"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Share</span>
          </button>
        </div>
      </header>

      <Board />

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-xl rounded-lg px-4 py-3 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-text-primary">{toastMessage}</span>
        </div>
      )}
    </main>
  );
};
