import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from './Task';
import { Plus } from 'lucide-react';
import { useDatabase } from '../db/DatabaseProvider';
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
      className={`flex flex-col flex-1 min-w-[320px] max-w-[380px] bg-surface/30 rounded-xl p-4 h-full border border-border/50 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div 
          {...attributes} 
          {...listeners}
          className="flex-1 flex items-center cursor-grab active:cursor-grabbing mr-2"
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
              {column.title}
              <span className="bg-surface-hover text-text-secondary text-xs px-2 py-0.5 rounded-full font-medium">
                {tasks.length}
              </span>
            </h3>
          )}
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="text-text-secondary hover:text-text-primary hover:bg-surface-hover p-1.5 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 min-h-[150px] custom-scrollbar">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <Task key={task.id} task={task} />
          ))}
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
