import React, { useEffect, useState } from 'react';
import { useDatabase } from '../db/DatabaseProvider';

import { Plus, LayoutTemplate, Clock, ArrowRight, Share2, Loader2, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/react';
import { useSyncContext } from '../hooks/useSyncEngine';
import { useAppStore } from '../store';
import { Modal } from './Modal';

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
    <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
      {/* Mobile Top Nav (only visible on mobile, since sidebar is hidden) */}
      <div className="md:hidden flex items-center px-4 h-14 border-b border-border bg-surface/30 sticky top-0 z-10 backdrop-blur-md">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md hover:bg-surface-hover"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-semibold text-text-primary ml-2">Dashboard</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-12">
        <header className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Welcome back, {user?.firstName}!</h1>
          <p className="text-sm sm:text-base text-text-secondary mt-2">Here's an overview of your workspaces and projects.</p>
        </header>

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-accent" />
              Your Projects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="group h-48 rounded-2xl border-2 border-dashed border-border/60 hover:border-accent hover:bg-accent/10 backdrop-blur-sm flex flex-col items-center justify-center gap-3 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-text-secondary group-hover:text-accent" />
              </div>
              <span className="font-medium text-text-secondary group-hover:text-accent">Create New Project</span>
            </button>

            {boards.map(board => (
              <div 
                key={board.id}
                onClick={() => navigate(`/b/${board.id}`)}
                className="group h-48 bg-surface border border-border/80 backdrop-blur-xl rounded-2xl p-6 flex flex-col hover:border-accent hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-accent/20 transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                  <ArrowRight className="w-5 h-5 text-accent" />
                </div>
                
                <h3 className="text-lg font-semibold text-text-primary mb-2 pr-8">{board.title}</h3>
                <div className="flex items-center gap-2 text-xs text-text-secondary mb-auto">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {new Date(board.updatedAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <div className="px-2.5 py-1 rounded bg-surface-hover text-xs font-medium text-text-secondary flex items-center gap-1.5">
                    <Share2 className="w-3 h-3" />
                    Code: {board.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 bg-surface/80 backdrop-blur-xl border border-border/80 rounded-2xl p-6 max-w-md shadow-lg">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-accent" />
            Join a Project
          </h2>
          <form onSubmit={handleJoinProject} className="flex gap-2">
            <input 
              type="text" 
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Paste Project Code here..."
              className="flex-1 bg-background border border-border focus:border-accent rounded-lg px-4 py-2 outline-none text-text-primary text-sm"
            />
            <button 
              type="submit"
              disabled={!joinCode.trim() || isJoining}
              className="bg-accent hover:bg-accent/80 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
            </button>
          </form>
          {joinError && <p className="text-red-400 text-xs mt-2">{joinError}</p>}
        </section>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Project Name</label>
            <input
              type="text"
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
              placeholder="e.g. Marketing Campaign"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">Cancel</button>
            <button type="submit" disabled={!newProjectName.trim()} className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
