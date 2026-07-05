import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  currentBoardId: string | null;
  setCurrentBoardId: (id: string | null) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  syncStatus: 'idle' | 'syncing' | 'error';
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  filterPriorities: string[];
  setFilterPriorities: (priorities: string[]) => void;
  filterLabels: string[];
  setFilterLabels: (labels: string[]) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentBoardId: null,
      setCurrentBoardId: (id) => set({ currentBoardId: id }),
      isOffline: !navigator.onLine,
      setIsOffline: (offline) => set({ isOffline: offline }),
      syncStatus: 'idle',
      setSyncStatus: (status) => set({ syncStatus: status }),
      selectedTaskId: null,
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      isSearchOpen: false,
      setIsSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
      filterPriorities: [],
      setFilterPriorities: (priorities) => set({ filterPriorities: priorities }),
      filterLabels: [],
      setFilterLabels: (labels) => set({ filterLabels: labels }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'zerolag-store',
      partialize: (state) => ({ theme: state.theme }), // Only persist the theme
    }
  )
);
