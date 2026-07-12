import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User } from 'lucide-react';
import { useAppStore } from '../../../store';

interface TaskProps {
  task: any;
  columnTitle?: string;
}

const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[#_*~`]/g, '') // Remove basic formatting
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Extract link text
    .replace(/- \[x?\]/gi, '') // Remove checklists
    .replace(/^\s*[-*+]\s+/gm, '') // Remove bullets
    .trim();
};

export const Task: React.FC<TaskProps> = ({ task, columnTitle }) => {
  const setSelectedTaskId = useAppStore(state => state.setSelectedTaskId);
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="glass-card opacity-60 border-2 border-accent shadow-[0_20px_50px_rgba(99,102,241,0.3)] scale-[1.02] rounded-xl p-4 mb-3 z-50"
      >
        <div className="h-10"></div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="glass-card rounded-xl p-4 mb-3 hover:-translate-y-1 group relative cursor-pointer overflow-hidden"
      onClick={() => setSelectedTaskId(task.id)}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="text-text-secondary cursor-grab active:cursor-grabbing p-1 -ml-1 mt-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 shrink-0 transition-opacity touch-none select-none"
          onClick={(e) => e.stopPropagation()} // Prevent opening panel when clicking the drag handle
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <h4 className="text-text-primary text-sm font-medium leading-snug break-words">{task.title}</h4>
          {task.description && (
            <p className="text-text-secondary text-xs mt-1 line-clamp-2">{stripMarkdown(task.description)}</p>
          )}
          
          {(task.labels && task.labels.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.labels.map((label: string, index: number) => (
                <span key={index} className="bg-accent/20 text-accent border border-accent/30 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none">
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-3 flex-wrap w-full">
            <div className="flex items-center gap-2 flex-wrap">
            {task.priority && (
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                task.priority === 'urgent' ? 'text-red-400 border-red-500/50 shadow-[0_0_8px_rgba(248,113,113,0.2)] bg-red-500/10' :
                task.priority === 'high' ? 'text-orange-400 border-orange-500/50 shadow-[0_0_8px_rgba(251,146,60,0.2)] bg-orange-500/10' :
                task.priority === 'normal' ? 'text-blue-400 border-blue-500/50 shadow-[0_0_8px_rgba(96,165,250,0.2)] bg-blue-500/10' :
                'text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(52,211,153,0.2)] bg-emerald-500/10'
              }`}>
                {task.priority}
              </span>
            )}
            
            {(() => {
              const isCompleted = columnTitle?.toLowerCase().includes('done') || columnTitle?.toLowerCase().includes('complete') || task.status?.toLowerCase() === 'done';
              
              if (isCompleted) {
                let isLateCompleted = false;
                if (task.dueDate) {
                  const [year, month, day] = task.dueDate.split('-');
                  const dueDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59);
                  const completedDate = new Date(task.updatedAt);
                  isLateCompleted = completedDate > dueDateObj;
                }
                
                return (
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                    isLateCompleted 
                      ? 'text-orange-400 border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.3)] bg-orange-500/20' 
                      : 'text-emerald-500 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)] bg-emerald-500/20'
                  }`}>
                    {isLateCompleted ? 'LATE COMPLETED' : 'COMPLETED'}
                  </span>
                );
              }
              
              if (task.dueDate) {
                const [year, month, day] = task.dueDate.split('-');
                const formattedDate = `${month}/${day}/${year} AT 11:59P.M.`;
                const dueDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59);
                const isOverdue = new Date() > dueDateObj;
                
                return (
                  <>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      isOverdue 
                        ? 'text-red-400 border-red-500/50 shadow-[0_0_8px_rgba(248,113,113,0.2)] bg-red-500/10' 
                        : 'text-indigo-400 border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.2)] bg-indigo-500/10'
                    }`}>
                      {formattedDate}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border text-red-500 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)] bg-red-500/20 animate-pulse">
                        DELAY
                      </span>
                    )}
                  </>
                );
              }
              
              return null;
            })()}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {task.assignee && (
                <div className="flex items-center gap-1 text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-md border border-accent/20">
                  <User className="w-3 h-3" />
                  <span className="font-medium truncate max-w-[60px]">{task.assignee}</span>
                </div>
              )}
              <span className="text-text-secondary text-[10px]">
                {new Date(task.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
