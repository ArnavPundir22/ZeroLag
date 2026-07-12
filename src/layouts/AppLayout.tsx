import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { Bell } from 'lucide-react';

import { useAppStore } from '../store';
import { SyncProvider } from '../hooks/useSyncEngine';
import { Sidebar } from '../components/layout/Sidebar';
import { SearchOverlay } from '../components/layout/SearchOverlay';
import { TaskDetailsPanel } from '../features/tasks/components/TaskDetailsPanel';
import { useAttachmentUploader } from '../hooks/useAttachmentUploader';

const BackgroundUploader = () => {
  useAttachmentUploader();
  return null;
};

export const AppLayout = () => {
  const setIsSearchOpen = useAppStore(state => state.setIsSearchOpen);
  const setIsSidebarOpen = useAppStore(state => state.setIsSidebarOpen);
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const globalToastMessage = useAppStore(state => state.globalToastMessage);
  const setGlobalToastMessage = useAppStore(state => state.setGlobalToastMessage);
  const setDeferredPrompt = useAppStore(state => state.setDeferredPrompt);

  // Global Keyboard Shortcuts
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setIsSearchOpen(true);
  });
  
  useHotkeys('mod+b', (e) => {
    e.preventDefault();
    setIsSidebarOpen(true);
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

  useEffect(() => {
    if (localStorage.getItem('v4_update_msg_shown') === 'false') {
      setTimeout(() => {
        setGlobalToastMessage('ZeroLag is upgraded to v4. The app got refreshed to the root level.');
        localStorage.setItem('v4_update_msg_shown', 'true');
      }, 1000);
    }
  }, [setGlobalToastMessage]);

  useEffect(() => {
    // Check if the event fired before React mounted
    if ((window as any).deferredPromptEvent) {
      setDeferredPrompt((window as any).deferredPromptEvent);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [setDeferredPrompt]);

  return (
    <SyncProvider>
      <BackgroundUploader />
      <div className="flex h-screen bg-transparent text-text-primary overflow-hidden font-sans">
        <Sidebar />
        
        <main className="flex-1 flex flex-col relative z-0 min-w-0 min-h-0">
          <Outlet />
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
