import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Board } from './components/Board';
import { TaskDetailsPanel } from './components/TaskDetailsPanel';
import { SearchOverlay } from './components/SearchOverlay';
import { DatabaseProvider, useDatabase } from './db/DatabaseProvider';
import { Bell, RefreshCw, CheckCircle2, AlertTriangle, Share2, Activity } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SyncProvider } from './hooks/useSyncEngine';
import { SignIn, useUser } from '@clerk/react';
import { useAppStore } from './store';

const BoardRouteWrapper = () => {
  const { boardId } = useParams();
  const setCurrentBoardId = useAppStore(state => state.setCurrentBoardId);
  
  useEffect(() => {
    if (boardId) {
      setCurrentBoardId(boardId);
    }
  }, [boardId, setCurrentBoardId]);

  return <BoardView />;
};

const BoardView = () => {
  const currentBoardId = useAppStore(state => state.currentBoardId);
  const isOffline = useAppStore(state => state.isOffline);
  const syncStatus = useAppStore(state => state.syncStatus);
  const filterPriorities = useAppStore(state => state.filterPriorities);
  const setFilterPriorities = useAppStore(state => state.setFilterPriorities);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const db = useDatabase();
  const [boardTitle, setBoardTitle] = useState('Board');

  useEffect(() => {
    if (!db || !currentBoardId) return;
    const sub = db.boards.findOne({ selector: { id: currentBoardId } }).$.subscribe((doc: any) => {
      if (doc) setBoardTitle(doc.title);
    });
    return () => sub.unsubscribe();
  }, [db, currentBoardId]);

  const togglePriorityFilter = (priority: string) => {
    if (filterPriorities.includes(priority)) {
      setFilterPriorities(filterPriorities.filter(p => p !== priority));
    } else {
      setFilterPriorities([...filterPriorities, priority]);
    }
  };

  const handleShare = () => {
    if (!currentBoardId) return;
    navigator.clipboard.writeText(currentBoardId);
    alert('Project Code copied to clipboard: ' + currentBoardId + '\n\nShare this code with others so they can join your project.');
  };

  return (
    <main className="flex-1 overflow-hidden flex flex-col relative">
      <header className="h-14 border-b border-border flex items-center justify-between px-8 shrink-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <h2 className="font-medium text-text-primary">
            {boardTitle}
          </h2>
          
          <div className="h-4 w-px bg-border mx-2" />
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border transition-colors ${filterPriorities.length > 0 ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
            >
              Filter {filterPriorities.length > 0 && `(${filterPriorities.length})`}
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
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
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
                Offline Mode
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Syncing
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                Sync Error
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Synced
              </>
            )}
          </div>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
            title="Share Project"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button className="text-text-secondary hover:text-text-primary transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      <Board />
    </main>
  );
};

const AppContent = () => {
  const setIsOffline = useAppStore(state => state.setIsOffline);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline]);
  return (
    <SyncProvider>
      <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans">
        <Sidebar />
        
        <main className="flex-1 flex flex-col relative z-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/b/:boardId" element={<BoardRouteWrapper />} />
          </Routes>
        </main>
        
        <TaskDetailsPanel />
        <SearchOverlay />
      </div>
    </SyncProvider>
  );
};

const LoginScreen = () => {
  return (
    <div className="h-screen w-screen flex bg-background">
      {/* Left Panel: Graphic / Value Prop */}
      <div className="hidden lg:flex flex-1 relative bg-surface overflow-hidden">
        {/* Abstract shapes / gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex flex-col justify-center h-full p-20 text-text-primary">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/30">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">ZeroLag</h1>
          </div>
          <h2 className="text-6xl font-bold mb-6 leading-tight">
            Offline-first.<br/>
            Real-time sync.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">Zero compromises.</span>
          </h2>
          <p className="text-xl text-text-secondary max-w-lg mt-4">
            Manage your tasks seamlessly without ever worrying about loading spinners or lost connections. Work fully offline and magically sync when you're back.
          </p>
        </div>
      </div>

      {/* Right Panel: Auth */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 relative z-10 bg-background/50 backdrop-blur-2xl">
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">ZeroLag</h1>
        </div>
        
        <div className="w-full max-w-[400px]">
          <SignIn 
            routing="hash" 
            fallbackRedirectUrl="/" 
            signUpFallbackRedirectUrl="/"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-surface border border-border shadow-2xl rounded-2xl w-full p-8",
                headerTitle: "text-text-primary text-2xl font-bold",
                headerSubtitle: "text-text-secondary",
                socialButtonsBlockButton: "bg-surface-hover border border-border hover:bg-surface-hover/80 text-text-primary h-11",
                socialButtonsBlockButtonText: "text-text-primary font-medium",
                dividerLine: "bg-border",
                dividerText: "text-text-secondary",
                formFieldLabel: "text-text-primary font-medium",
                formFieldInput: "bg-background border-border text-text-primary focus:border-accent focus:ring-1 focus:ring-accent h-11",
                formButtonPrimary: "bg-accent hover:bg-accent/90 text-white font-medium h-11 text-base shadow-lg shadow-accent/20",
                footerActionText: "text-text-secondary",
                footerActionLink: "text-accent hover:text-accent/80 font-medium"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

const SignedIn = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();
  return isSignedIn ? <>{children}</> : null;
};

const SignedOut = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();
  return !isSignedIn ? <>{children}</> : null;
};

const ProtectedApp = () => {
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="h-screen w-screen flex items-center justify-center text-text-secondary">Loading...</div>;
  }

  return (
    <>
      <SignedOut>
        <LoginScreen />
      </SignedOut>
      <SignedIn>
        <DatabaseProvider>
          <AppContent />
        </DatabaseProvider>
      </SignedIn>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ProtectedApp />
    </BrowserRouter>
  );
}

export default App;
