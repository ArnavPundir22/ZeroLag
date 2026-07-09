import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Board } from './components/Board';
import { TaskDetailsPanel } from './components/TaskDetailsPanel';
import { SearchOverlay } from './components/SearchOverlay';
import { DatabaseProvider, useDatabase } from './db/DatabaseProvider';
import { Bell, RefreshCw, CheckCircle2, AlertTriangle, Share2, Activity, Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SyncProvider } from './hooks/useSyncEngine';
import { ClerkProvider, SignIn, useUser } from '@clerk/react';
import { dark } from '@clerk/themes';
import { useAppStore } from './store';
import { useHotkeys } from 'react-hotkeys-hook';

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
  const filterLabels = useAppStore(state => state.filterLabels);
  const setFilterLabels = useAppStore(state => state.setFilterLabels);
  const setIsSidebarOpen = useAppStore(state => state.setIsSidebarOpen);
  const notificationsEnabled = useAppStore(state => state.notificationsEnabled);
  const setNotificationsEnabled = useAppStore(state => state.setNotificationsEnabled);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
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
          <div className="relative">
            <button 
              onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
              className={`flex items-center justify-center min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] p-1.5 sm:px-3 transition-colors rounded-lg ${isNotificationMenuOpen || notificationsEnabled ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            {isNotificationMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-xl z-50 p-4">
                  <h4 className="text-sm font-bold text-text-primary mb-2">Notifications</h4>
                  <p className="text-xs text-text-secondary mb-4">Would you like to receive notifications for task updates?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setNotificationsEnabled(true);
                        setIsNotificationMenuOpen(false);
                      }}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${notificationsEnabled ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'}`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => {
                        setNotificationsEnabled(false);
                        setIsNotificationMenuOpen(false);
                      }}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${!notificationsEnabled ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'}`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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

const AppContent = () => {
  const setIsSearchOpen = useAppStore(state => state.setIsSearchOpen);
  const setIsSidebarOpen = useAppStore(state => state.setIsSidebarOpen);
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const globalToastMessage = useAppStore(state => state.globalToastMessage);
  const setGlobalToastMessage = useAppStore(state => state.setGlobalToastMessage);

  // Global Keyboard Shortcuts
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setIsSearchOpen(true);
  });
  
  useHotkeys('mod+b', (e) => {
    e.preventDefault();
    setIsSidebarOpen(true); // Toggle logic could be used if we had access to current state directly, but we don't in this hook without passing it as deps
  });

  useHotkeys('mod+d', (e) => {
    e.preventDefault();
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    if (globalToastMessage) {
      const timer = setTimeout(() => {
        setGlobalToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [globalToastMessage, setGlobalToastMessage]);

  return (
    <SyncProvider>
      <div className="flex h-screen bg-transparent text-text-primary overflow-hidden font-sans">
        <Sidebar />
        
        <main className="flex-1 flex flex-col relative z-0 min-w-0 min-h-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/b/:boardId" element={<BoardRouteWrapper />} />
          </Routes>
        </main>
        
        <TaskDetailsPanel />
        <SearchOverlay />
        
        {globalToastMessage && (
          <div className="fixed top-4 right-4 bg-surface border border-border shadow-2xl rounded-lg p-4 z-[100] flex flex-col gap-2 max-w-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-accent animate-pulse" />
              <span className="text-sm font-bold text-text-primary">New Update</span>
            </div>
            <span className="text-xs text-text-secondary leading-relaxed">{globalToastMessage}</span>
          </div>
        )}
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
  const { isLoaded, isSignedIn, user } = useUser();
  const isOffline = useAppStore(state => state.isOffline);
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

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('zerolag_offline_user_id', user.id);
    } else if (isLoaded && !isSignedIn && !isOffline) {
      localStorage.removeItem('zerolag_offline_user_id');
    }
  }, [user?.id, isLoaded, isSignedIn, isOffline]);

  const offlineUserId = localStorage.getItem('zerolag_offline_user_id');

  if (isOffline && offlineUserId) {
    return (
      <DatabaseProvider offlineUserId={offlineUserId}>
        <AppContent />
      </DatabaseProvider>
    );
  }

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

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const ClerkProviderWithTheme = ({ children }: { children: React.ReactNode }) => {
  const theme = useAppStore(state => state.theme);
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={{ theme: theme === 'dark' ? dark : undefined }}
    >
      {children}
    </ClerkProvider>
  );
};

function App() {
  return (
    <ClerkProviderWithTheme>
      <BrowserRouter>
        <ProtectedApp />
      </BrowserRouter>
    </ClerkProviderWithTheme>
  );
}

export default App;
