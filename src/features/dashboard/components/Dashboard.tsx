import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../../db/DatabaseProvider';

import { Plus, Menu, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useUser, UserButton } from '@clerk/react';
import { useSyncContext } from '../../../hooks/useSyncEngine';
import { useAppStore } from '../../../store';
import { Modal } from '../../../components/ui/Modal';
import { SettingsModal } from '../../settings/components/SettingsModal';
import { ProjectCard } from './ProjectCard';
import { JoinProjectForm } from './JoinProjectForm';

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
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean, targetId: string | null }>({ isOpen: false, targetId: null });

  useEffect(() => {
    if (!db) return;
    const sub = db.boards.find().$.subscribe((docs: any[]) => {
      const allBoards = docs.map((d: any) => d.toJSON());
      allBoards.sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return dateB - dateA;
      });
      setBoards(allBoards);
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

  const handleDeleteBoard = async () => {
    if (!db || !deleteModalState.targetId) return;
    try {
      const doc = await db.boards.findOne({ selector: { id: deleteModalState.targetId } }).exec();
      if (doc) {
        await doc.remove();
      }
    } catch (err) {
      console.error('Failed to delete board:', err);
    }
    setDeleteModalState({ isOpen: false, targetId: null });
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
            title="Settings"
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
              <ProjectCard key={board.id} board={board} navigate={navigate} onDelete={(id) => setDeleteModalState({ isOpen: true, targetId: id })} />
            ))}
          </div>
        </section>

        <JoinProjectForm 
          handleJoinProject={handleJoinProject}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          isJoining={isJoining}
          joinError={joinError}
        />
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

      <Modal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState({ isOpen: false, targetId: null })} title="Delete Project">
        <div className="space-y-4">
          <p className="text-text-secondary">Are you sure you want to delete this project? This action cannot be undone and will permanently remove all tasks.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button type="button" onClick={() => setDeleteModalState({ isOpen: false, targetId: null })} className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
            <button type="button" onClick={handleDeleteBoard} className="px-5 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Delete Permanently</button>
          </div>
        </div>
      </Modal>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};
