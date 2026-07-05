import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useAppStore } from '../store';

interface TaskProps {
  task: any;
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

export const Task: React.FC<TaskProps> = ({ task }) => {
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
        className="opacity-50 border-2 border-accent bg-surface-hover backdrop-blur-xl shadow-indigo-500/30 shadow-2xl scale-[1.02] rounded-xl p-4 mb-3 transition-all duration-300"
      >
        <div className="h-10"></div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface hover:bg-surface-hover border border-border backdrop-blur-md rounded-xl p-4 mb-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group relative cursor-pointer"
      onClick={() => setSelectedTaskId(task.id)}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="text-text-secondary cursor-grab active:cursor-grabbing w-5 h-5 mt-0.5 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
          onClick={(e) => e.stopPropagation()} // Prevent opening panel when clicking the drag handle
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-text-primary text-sm font-medium leading-tight">{task.title}</h4>
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

          <div className="flex gap-2 mt-3 items-center">
            {task.priority && (
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                task.priority === 'urgent' ? 'text-red-400 bg-red-400/10' :
                task.priority === 'high' ? 'text-orange-400 bg-orange-400/10' :
                task.priority === 'normal' ? 'text-blue-400 bg-blue-400/10' :
                'text-emerald-400 bg-emerald-400/10'
              }`}>
                {task.priority}
              </span>
            )}
            <span className="text-text-secondary text-[10px]">
              {new Date(task.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
