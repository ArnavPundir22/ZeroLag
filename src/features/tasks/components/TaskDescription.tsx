import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskDescriptionProps {
  task: any;
  updateField: (field: string, value: any) => void;
}

export const TaskDescription: React.FC<TaskDescriptionProps> = ({ task, updateField }) => {
  const [isPreview, setIsPreview] = useState(true);
  const [localDescription, setLocalDescription] = useState('');
  const [isDescFocused, setIsDescFocused] = useState(false);

  return (
    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest">Description</h3>
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setIsPreview(false)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${!isPreview ? 'bg-accent shadow text-white' : 'text-text-secondary hover:text-white'}`}
          >
            Edit
          </button>
          <button 
            onClick={() => setIsPreview(true)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${isPreview ? 'bg-accent shadow text-white' : 'text-text-secondary hover:text-white'}`}
          >
            Preview
          </button>
        </div>
      </div>
      
      {!isPreview ? (
        <textarea
          value={isDescFocused ? localDescription : (task.description || '')}
          onFocus={() => { setIsDescFocused(true); setLocalDescription(task.description || ''); }}
          onBlur={() => setIsDescFocused(false)}
          onChange={(e) => {
            setLocalDescription(e.target.value);
            updateField('description', e.target.value);
          }}
          placeholder="Add a more detailed description (Markdown supported)..."
          className="w-full bg-transparent border border-transparent rounded-lg text-sm text-white focus:outline-none min-h-[120px] resize-y placeholder-text-secondary/50 font-mono"
        />
      ) : (
        <div 
          className="w-full text-sm text-white min-h-[120px] markdown-preview"
          onDoubleClick={() => setIsPreview(false)}
        >
          {task.description ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {task.description}
            </ReactMarkdown>
          ) : (
            <span className="text-text-secondary/50 italic cursor-pointer" onClick={() => setIsPreview(false)}>
              No description provided. Click 'Edit' or double-click to add one.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
