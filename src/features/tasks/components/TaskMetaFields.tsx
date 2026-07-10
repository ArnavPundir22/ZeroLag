import React from 'react';
import { AlertCircle, Calendar, Tag, Users } from 'lucide-react';

interface TaskMetaFieldsProps {
  task: any;
  columns: any[];
  updateField: (field: string, value: any) => void;
  getPriorityColors: (priority: string) => string;
}

export const TaskMetaFields: React.FC<TaskMetaFieldsProps> = ({ task, columns, updateField, getPriorityColors }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="flex flex-col gap-3">
        <div className="text-text-secondary flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <AlertCircle className="w-3.5 h-3.5" /> Priority
        </div>
        <div className="flex flex-col gap-2">
          {['low', 'normal', 'high', 'urgent'].map(p => (
            <button
              key={p}
              onClick={() => updateField('priority', p)}
              className={`w-full capitalize py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                task.priority === p
                  ? getPriorityColors(p)
                  : 'border-white/5 text-text-secondary hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-text-secondary flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <Calendar className="w-3.5 h-3.5" /> Due Date
        </div>
        <input
          type="date"
          value={task.dueDate || ''}
          onChange={(e) => updateField('dueDate', e.target.value)}
          className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all color-scheme-dark shadow-inner"
        />

        <div className="text-text-secondary flex items-center gap-2 text-xs font-bold uppercase tracking-widest mt-4">
          <Tag className="w-3.5 h-3.5" /> Status
        </div>
        <select
          value={task.columnId || ''}
          onChange={(e) => updateField('columnId', e.target.value)}
          className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-inner appearance-none w-full"
        >
          {columns.map(col => (
            <option key={col.id} value={col.id} className="bg-background text-text-primary">
              {col.title}
            </option>
          ))}
        </select>
        <div className="text-text-secondary flex items-center gap-2 text-xs font-bold uppercase tracking-widest mt-4">
          <Users className="w-3.5 h-3.5" /> Assignee
        </div>
        <input
          type="text"
          placeholder="e.g. Arnav"
          value={task.assignee || ''}
          onChange={(e) => updateField('assignee', e.target.value)}
          className="bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-inner w-full"
        />
        <div className="text-text-secondary flex items-center gap-2 text-xs font-bold uppercase tracking-widest mt-4">
          <Tag className="w-3.5 h-3.5" /> Story Points
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            placeholder="0"
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium text-white focus:outline-none focus:border-accent w-full text-center"
          />
        </div>
      </div>
    </div>
  );
};
