import React from 'react';
import { Tag, X } from 'lucide-react';

interface TaskLabelsProps {
  task: any;
  updateField: (field: string, value: any) => void;
}

export const TaskLabels: React.FC<TaskLabelsProps> = ({ task, updateField }) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-text-secondary flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
        <Tag className="w-3.5 h-3.5" /> Labels
      </div>
      <div className="flex flex-wrap gap-2">
        {(task.labels || []).map((label: string, index: number) => (
          <span key={index} className="bg-accent/20 text-accent border border-accent/30 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            {label}
            <button 
              onClick={() => {
                const newLabels = task.labels.filter((_: any, i: number) => i !== index);
                updateField('labels', newLabels);
              }}
              className="hover:bg-accent/40 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder="+ Add Label"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              e.preventDefault();
              const val = e.currentTarget.value.trim();
              if (!(task.labels || []).includes(val)) {
                updateField('labels', [...(task.labels || []), val]);
              }
              e.currentTarget.value = '';
            }
          }}
          className="bg-black/20 border border-dashed border-white/20 rounded-xl px-3 py-1.5 text-xs font-medium text-white focus:outline-none focus:border-accent w-24 transition-all focus:w-32 placeholder-text-secondary"
        />
      </div>
    </div>
  );
};
