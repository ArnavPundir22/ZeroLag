import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../../db/DatabaseProvider';
import { LayoutDashboard, Clock, ArrowRight, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  board: any;
  navigate: (path: string) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ board, navigate, onDelete }) => {
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
      className="group h-[240px] relative bg-surface border border-border rounded-2xl p-6 flex flex-col hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden shadow-soft-lg dark:shadow-2xl hover:border-accent hover:shadow-xl dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] isolate"
    >
      {/* Abstract Glowing Mesh Gradient Background */}
      <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-700 -z-10" />
      <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] group-hover:bg-purple-500/30 group-hover:scale-110 transition-all duration-700 -z-10" />
      
      {/* Delete Button (Absolute Top Right) */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(board.id);
        }}
        className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all duration-200 text-text-secondary opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-soft"
        title="Delete Project"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Top Bar: Icon */}
      <div className="flex justify-start items-start z-10 mb-6">
        <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center border border-border group-hover:border-accent group-hover:bg-accent/5 transition-all duration-300 shadow-soft">
          <LayoutDashboard className="w-6 h-6 text-text-primary" />
        </div>
      </div>
      
      <div className="z-10 mt-auto relative">
        <div className="pr-12">
          <h3 className="text-xl font-bold text-text-primary mb-1.5 line-clamp-1 tracking-tight group-hover:text-accent transition-colors duration-200">
            {board.title}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-text-secondary font-medium uppercase tracking-widest mb-5">
            <Clock className="w-3.5 h-3.5" />
            <span>Synced {new Date(board.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="absolute right-0 top-2 w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center border border-border text-text-primary transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-soft -translate-x-2 group-hover:translate-x-0">
          <ArrowRight className="w-4 h-4" />
        </div>
        
        <div className="w-full">
          <div className="flex justify-between text-[11px] font-bold tracking-wide mb-2 uppercase">
            <span className="text-text-secondary">Progress</span>
            <span className="text-text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
