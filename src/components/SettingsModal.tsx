import React from 'react';
import { Modal } from './Modal';
import { useAppStore } from '../store';
import { Moon, Sun, Monitor, Download, RefreshCw, Wifi, WifiOff, Database } from 'lucide-react';
import { useUser } from '@clerk/react';
import { importTimetable } from '../utils/importTimetable';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, deferredPrompt }) => {
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const isOffline = useAppStore(state => state.isOffline);
  const isOnline = !isOffline;
  const status = useAppStore(state => state.syncStatus);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        // App installed successfully
      }
    }
  };

  const { user } = useUser();
  const handleImportTimetable = async () => {
    if (user) {
      await importTimetable(user.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings & Preferences">
      <div className="space-y-6">
        {/* Appearance Section */}
        <section>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Appearance</h3>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-2 flex gap-2">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
              { id: 'system', icon: Monitor, label: 'System' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                  theme === t.id 
                    ? 'bg-accent shadow-[0_0_15px_rgba(99,102,241,0.3)] text-white' 
                    : 'text-text-secondary hover:bg-white/5 hover:text-white'
                }`}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Sync Engine Section */}
        <section>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Sync Engine</h3>
          <div className="bg-black/20 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Network Status</h4>
                  <p className="text-xs text-text-secondary">{isOnline ? 'Connected' : 'Offline Mode'}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded-md border ${isOnline ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="h-px bg-white/10 w-full" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <RefreshCw className={`w-5 h-5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sync Status</h4>
                  <p className="text-xs text-text-secondary capitalize">{status}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System & PWA Section */}
        {deferredPrompt && (
          <section>
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">System</h3>
            <button
              onClick={handleInstallPwa}
              className="w-full bg-gradient-to-r from-accent to-purple-500 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:opacity-90 transition-opacity shadow-[0_8px_30px_rgb(99,102,241,0.2)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-white">Install App</h4>
                  <p className="text-xs text-white/80">Get the full native experience</p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-white text-accent text-xs font-bold uppercase rounded-lg shadow-sm">
                Install
              </span>
            </button>
          </section>
        )}

        {/* Data Section */}
        <section>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Templates</h3>
          <button
            onClick={handleImportTimetable}
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-white">Weekly Timetable</h4>
                <p className="text-xs text-text-secondary">Create a blank Mon-Sun schedule</p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold uppercase rounded-lg">
              Create
            </span>
          </button>
        </section>
      </div>
    </Modal>
  );
};
