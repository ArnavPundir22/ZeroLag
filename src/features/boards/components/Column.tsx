import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../tasks/components/Task';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useDatabase } from '../../../db/DatabaseProvider';
import { v4 as uuidv4 } from 'uuid';

interface ColumnProps {
  column: any;
  tasks: any[];
}

export const Column: React.FC<ColumnProps> = ({ column, tasks }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const db = useDatabase();

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'Column', column }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskIds = tasks.map(t => t.id);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const taskId = uuidv4();
    await db.tasks.insert({
      id: taskId,
      columnId: column.id,
      title: newTaskTitle.trim(),
      description: '',
      priority: 'normal',
      labels: [],
      position: tasks.length,
      updatedAt: new Date().toISOString(),
      version: 1,
      deviceId: 'local'
    });

    await db.activities.insert({
      id: uuidv4(),
      taskId,
      type: 'created',
      description: 'Task created',
      timestamp: new Date().toISOString()
    });

    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleUpdateTitle = async () => {
    setIsEditingTitle(false);
    if (!editTitle.trim() || editTitle.trim() === column.title) {
        setEditTitle(column.title);
        return;
    }
    
    try {
        const doc = await db.columns.findOne({ selector: { id: column.id } }).exec();
        if (doc) {
            await doc.patch({ title: editTitle.trim() });
        }
    } catch (err) {
        console.error('Failed to update column title', err);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`flex flex-col flex-shrink-0 min-w-full md:flex-1 md:min-w-[280px] bg-surface/20 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ${isDragging ? 'opacity-50 ring-2 ring-accent' : ''} ${!isMobileExpanded ? 'h-auto md:h-full md:max-h-full md:min-h-0' : 'h-[65vh] md:h-full max-h-[80vh] md:max-h-full min-h-0'}`}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div 
          {...attributes} 
          {...listeners}
          className="flex-1 flex items-center cursor-grab active:cursor-grabbing mr-2 touch-none select-none"
        >
          {isEditingTitle ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateTitle(); }}
              className="bg-background border border-accent rounded px-2 py-1 text-sm font-semibold text-text-primary focus:outline-none w-full"
            />
          ) : (
            <h3 
              onDoubleClick={() => setIsEditingTitle(true)}
              className="font-semibold text-text-primary text-sm tracking-wide flex items-center gap-2 w-full"
            >
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMobileExpanded(!isMobileExpanded); }}
                className="md:hidden text-text-secondary hover:text-text-primary p-1 -ml-1 rounded-md hover:bg-surface-hover active:bg-surface-hover/80"
              >
                {isMobileExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <span className="truncate">{column.title}</span>
              <span className="bg-surface-hover text-text-secondary text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                {tasks.length}
              </span>
            </h3>
          )}
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="text-text-secondary hover:text-white hover:bg-accent p-2 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center hover:shadow-lg hover:shadow-accent/20"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden p-1 custom-scrollbar md:min-h-[150px] ${isMobileExpanded ? 'block' : 'hidden md:block'}`}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <Task key={task.id} task={task} columnTitle={column.title} />
          ))}
          
          {tasks.length === 0 && !isAdding && (
            <div className="flex flex-col items-center justify-center h-28 text-text-secondary/40 border-2 border-dashed border-border/30 rounded-xl m-1 mt-2">
              <span className="text-sm font-medium tracking-wide">Drop tasks here</span>
            </div>
          )}
        </SortableContext>

        {isAdding && (
          <form onSubmit={handleAddTask} className="mt-1">
            <input
              autoFocus
              type="text"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onBlur={() => {
                if (!newTaskTitle.trim()) setIsAdding(false);
              }}
              className="w-full bg-surface border border-accent/50 rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-accent shadow-sm"
            />
          </form>
        )}
      </div>
    </div>
  );
};
