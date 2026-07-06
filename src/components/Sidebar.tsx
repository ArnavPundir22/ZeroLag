import React, { useEffect, useState } from 'react';
import { Activity, Layout, Search, Plus, Trash2, Home, Link2 } from 'lucide-react';
import { useAppStore } from '../store';
import { useDatabase } from '../db/DatabaseProvider';
import { v4 as uuidv4 } from 'uuid';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/react';
import { useSyncContext } from '../hooks/useSyncEngine';
import { Modal } from './Modal';
import { SettingsModal } from './SettingsModal';
import { Settings } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useUser();
  const currentBoardId = useAppStore(state => state.currentBoardId);
  const setCurrentBoardId = useAppStore(state => state.setCurrentBoardId);
  const setIsSearchOpen = useAppStore(state => state.setIsSearchOpen);
  const isSidebarOpen = useAppStore(state => state.isSidebarOpen);
  const setIsSidebarOpen = useAppStore(state => state.setIsSidebarOpen);

  const db = useDatabase();
  const [boards, setBoards] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { joinRemoteBoard } = useSyncContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isJoining, setIsJoining] = useState(false);
  const [modalState, setModalState] = useState<{
    type: 'create' | 'join' | 'delete' | 'alert' | null;
    title?: string;
    message?: string;
    targetId?: string;
  }>({ type: null });
  const [inputValue, setInputValue] = useState('');

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname, setIsSidebarOpen]);

  useEffect(() => {
    if (!db) return;
    const sub = db.boards.find().$.subscribe((b: any[]) => {
      setBoards(b.map(doc => doc.toJSON()));
    });
    return () => sub.unsubscribe();
  }, [db]);


  const closeModal = () => {
    setModalState({ type: null });
    setInputValue('');
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !inputValue.trim()) return;
    
    const newBoardId = uuidv4();
    const boardTitle = inputValue.trim();

    await db.boards.insert({
      id: newBoardId,
      workspaceId: 'default',
      title: boardTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const columns = ['Todo', 'In Progress', 'Done'];
    for (let i = 0; i < columns.length; i++) {
      await db.columns.insert({
        id: uuidv4(),
        boardId: newBoardId,
        title: columns[i],
        position: i
      });
    }

    setCurrentBoardId(newBoardId);
    closeModal();
    navigate(`/b/${newBoardId}`);
  };

  const handleDeleteBoard = async () => {
    if (!db || !modalState.targetId) return;
    try {
      const boardId = modalState.targetId;
      const doc = await db.boards.findOne({ selector: { id: boardId } }).exec();
      if (doc) {
        await doc.remove();
        if (currentBoardId === boardId || location.pathname === `/b/${boardId}`) {
          const nextBoard = boards.find(b => b.id !== boardId);
          if (nextBoard) {
            setCurrentBoardId(nextBoard.id);
            navigate(`/b/${nextBoard.id}`);
          } else {
            setCurrentBoardId(null);
            navigate('/');
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete board:', err);
    }
    closeModal();
  };

  const handleJoinBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setIsJoining(true);
    const code = inputValue.trim();
    try {
      const success = await joinRemoteBoard(code);
      if (success) {
        setModalState({ type: 'alert', title: 'Success', message: 'Successfully joined the project!' });
        setCurrentBoardId(code);
        navigate(`/b/${code}`);
      } else {
        setModalState({ type: 'alert', title: 'Error', message: 'Failed to join project. Invalid code or project not found.' });
      }
    } catch (err) {
      console.error(err);
      setModalState({ type: 'alert', title: 'Error', message: 'An error occurred while joining the project.' });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-surface flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:bg-surface/30 shrink-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="h-14 flex items-center px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2 text-accent">
            <Activity className="w-5 h-5" />
            <h1 className="font-semibold text-lg tracking-tight text-text-primary">ZeroLag</h1>
          </Link>
        </div>

        {user && (
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-text-primary truncate">
                  {user.fullName || user.firstName || 'User'}
                </span>
                <span className="text-xs text-text-secondary truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex-1 p-4 space-y-6">
          <div>
            <Link 
              to="/" 
              className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg font-medium text-sm transition-colors ${
                location.pathname === '/' 
                  ? 'bg-surface-hover text-text-primary' 
                  : 'text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary'
              }`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          </div>

          <div>
            <div className="flex items-center justify-between text-text-secondary text-xs font-medium px-3 mb-2 uppercase tracking-wider">
              <span>Projects</span>
              <button onClick={() => setModalState({ type: 'create' })} className="hover:text-text-primary transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {boards.map(board => {
                const isActive = location.pathname === `/b/${board.id}`;
                return (
                  <div key={board.id} className="relative group">
                    <Link
                      to={`/b/${board.id}`}
                      onClick={() => setCurrentBoardId(board.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2 rounded-lg font-medium text-sm transition-colors ${
                        isActive 
                          ? 'bg-surface-hover text-text-primary' 
                          : 'text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary'
                      }`}
                    >
                      <Layout className={`w-4 h-4 ${isActive ? 'text-accent' : ''}`} />
                      <span className="truncate pr-6">{board.title}</span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setModalState({ type: 'delete', targetId: board.id });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-1 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-500/10"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setModalState({ type: 'join' })}
              className={`w-full flex items-center gap-3 px-3 py-3 sm:py-2 mt-4 rounded-lg font-medium text-sm transition-colors border border-dashed border-border text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary hover:border-accent/50`}
            >
              <Link2 className="w-4 h-4" />
              Join Shared Project
            </button>
          </div>

          <div>
            <div className="text-text-secondary text-xs font-medium px-3 mb-2 uppercase tracking-wider">Settings</div>
            <div className="space-y-0.5">
              <button onClick={() => setIsSearchOpen(true)} className="w-full flex items-center gap-3 px-3 py-3 sm:py-2 text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary rounded-lg font-medium text-sm transition-colors">
                <Search className="w-4 h-4" />
                Search
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-3 py-3 sm:py-2 text-text-secondary hover:bg-surface-hover/50 hover:text-text-primary rounded-lg font-medium text-sm transition-colors">
                <Settings className="w-4 h-4" />
                Settings & Preferences
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <Modal isOpen={modalState.type === 'create'} onClose={closeModal} title="Create New Project">
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Project Name</label>
            <input
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
              placeholder="e.g. Marketing Campaign"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
            <button type="submit" disabled={!inputValue.trim()} className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">Create</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalState.type === 'join'} onClose={closeModal} title="Join Shared Project">
        <form onSubmit={handleJoinBoard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Project Code</label>
            <input
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
              placeholder="Paste project code here..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
            <button type="submit" disabled={!inputValue.trim() || isJoining} className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalState.type === 'delete'} onClose={closeModal} title="Delete Project">
        <div className="space-y-4">
          <p className="text-text-secondary">Are you sure you want to delete this project? This action cannot be undone and will permanently remove all tasks.</p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
            <button type="button" onClick={handleDeleteBoard} className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600">Delete Permanently</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalState.type === 'alert'} onClose={closeModal} title={modalState.title || 'Notification'}>
        <div className="space-y-4">
          <p className="text-text-secondary">{modalState.message}</p>
          <div className="flex justify-end pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium bg-surface-hover text-text-primary rounded-lg hover:bg-surface-hover/80">OK</button>
          </div>
        </div>
      </Modal>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        deferredPrompt={null} 
      />
    </>
  );
};

