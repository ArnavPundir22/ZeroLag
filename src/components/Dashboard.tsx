import React, { useEffect, useState } from 'react';
import { useDatabase } from '../db/DatabaseProvider';

import { Plus, LayoutTemplate, Clock, ArrowRight, Share2, Loader2, Menu, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useUser, UserButton } from '@clerk/react';
import { useSyncContext } from '../hooks/useSyncEngine';
import { useAppStore } from '../store';
import { Modal } from './Modal';
import { SettingsModal } from './SettingsModal';

const ProjectCard = ({ board, navigate }: { board: any, navigate: any }) => {
  const db = useDatabase();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!db) return;
    
    const colSub = db.columns.find({ selector: { boardId: board.id } }).$.subscribe((cols: any[]) => {
      if (cols.length === 0) {
        setProgress(0);
        return;
      }
      
      // Find the 'Done' column, or fallback to the last column by position
      const doneCol = cols.find((c: any) => c.title.toLowerCase().includes('done') || c.title.toLowerCase().includes('complete')) 
        || cols.sort((a,b) => a.position - b.position)[cols.length - 1];
      
      const colIds = cols.map((c: any) => c.id);
      
      const taskSub = db.tasks.find().$.subscribe((tasks: any[]) => {
        const boardTasks = tasks.filter((t: any) => colIds.includes(t.columnId));
        if (boardTasks.length === 0) {
          setProgress(0);
          return;
        }
        
        const doneTasks = boardTasks.filter((t: any) => t.columnId === doneCol.id);
        const percent = Math.round((doneTasks.length / boardTasks.length) * 100);
        setProgress(percent);
      });
      
      return () => taskSub.unsubscribe();
    });
    
    return () => colSub.unsubscribe();
  }, [db, board.id]);

  return (
    <div 
      onClick={() => navigate(`/b/${board.id}`)}
      className="group h-[200px] bg-surface border border-border backdrop-blur-xl rounded-2xl p-6 flex flex-col hover:border-accent/50 hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      <div className="absolute inset-0 border-t border-white/5 rounded-2xl pointer-events-none" />
      
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30 shadow-[inset_0_0_12px_rgba(99,102,241,0.2)]">
          <LayoutTemplate className="w-5 h-5 text-accent" />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
          <ArrowRight className="w-5 h-5 text-accent" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-text-primary mb-1 pr-8 truncate">{board.title}</h3>
      <div className="flex items-center gap-2 text-[11px] text-text-secondary font-medium uppercase tracking-wider mb-auto">
        <Clock className="w-3 h-3" />
        <span>Synced {new Date(board.updatedAt).toLocaleDateString()}</span>
      </div>
      
      <div className="mt-4 w-full">
        <div className="flex justify-between text-xs font-semibold mb-2">
          <span className="text-text-secondary">Progress</span>
          <span className="text-accent">{progress}% Complete</span>
        </div>
        <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-accent to-blue-400 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const db = useDatabase();
  const navigate = useNavigate();
  const { user } = useUser();
  const { joinRemoteBoard } = useSyncContext();
  const setIsSidebarOpen = useAppStore(state => state.setIsSidebarOpen);
  
  const [boards, setBoards] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!db) return;
    const sub = db.boards.find({ sort: [{ updatedAt: 'desc' }] }).$.subscribe((docs: any[]) => {
      setBoards(docs.map((d: any) => d.toJSON()));
    });
    return () => sub.unsubscribe();
  }, [db]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !newProjectName.trim()) return;
    
    const boardId = `board-${uuidv4().slice(0, 8)}`;
    await db.boards.insert({
      id: boardId,
      workspaceId: user.id,
      title: newProjectName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Add default columns
    const cols = [
      { id: uuidv4(), boardId, title: 'To Do', position: 0 },
      { id: uuidv4(), boardId, title: 'In Progress', position: 1 },
      { id: uuidv4(), boardId, title: 'Done', position: 2 }
    ];
    await db.columns.bulkInsert(cols);
    setIsCreateModalOpen(false);
    setNewProjectName('');
    navigate(`/b/${boardId}`);
  };

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !db) return;
    
    setIsJoining(true);
    setJoinError('');
    
    // Check if we already have it
    const existing = await db.boards.findOne({ selector: { id: joinCode.trim() } }).exec();
    if (existing) {
      navigate(`/b/${joinCode.trim()}`);
      return;
    }

    const success = await joinRemoteBoard(joinCode.trim());
    if (success) {
      setJoinCode('');
      navigate(`/b/${joinCode.trim()}`);
    } else {
      setJoinError('Project not found or invalid code.');
    }
    setIsJoining(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background custom-scrollbar relative min-h-0">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 h-16 border-b border-border bg-surface/30 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md hover:bg-surface-hover transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
          </div>
          <span className="font-bold text-lg text-text-primary tracking-tight">ZeroLag</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-text-secondary hover:text-accent rounded-full hover:bg-accent/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-32">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Projects</h1>
          <p className="text-text-secondary">Manage your workspaces and track progress.</p>
        </header>

        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <ProjectCard key={board.id} board={board} navigate={navigate} />
            ))}
          </div>
        </section>

        <section className="bg-surface/50 backdrop-blur-xl border border-border rounded-2xl p-6 max-w-md shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4 relative z-10">
            <Share2 className="w-5 h-5 text-accent" />
            Join a Project
          </h2>
          <form onSubmit={handleJoinProject} className="flex gap-3 relative z-10">
            <input 
              type="text" 
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Paste Project Code here..."
              className="flex-1 bg-background/50 border border-border focus:border-accent rounded-xl px-4 py-2.5 outline-none text-text-primary text-sm shadow-inner transition-colors"
            />
            <button 
              type="submit"
              disabled={!joinCode.trim() || isJoining}
              className="bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2.5 rounded-xl transition-all text-sm disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-accent/20"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
            </button>
          </form>
          {joinError && <p className="text-red-400 text-xs mt-3 relative z-10">{joinError}</p>}
        </section>
      </div>

      {/* Floating Action Button (FAB) for Create Project */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-accent to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-accent/30 hover:scale-105 hover:shadow-accent/50 transition-all duration-300 z-50 group"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateBoard} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Project Name</label>
            <input
              type="text"
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-4 py-3 bg-surface-hover/50 border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent shadow-inner transition-colors"
              placeholder="e.g. Marketing Campaign"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
            <button type="submit" disabled={!newProjectName.trim()} className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-accent to-purple-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-accent/20">Create Project</button>
          </div>
        </form>
      </Modal>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        deferredPrompt={deferredPrompt} 
      />
    </div>
  );
};
