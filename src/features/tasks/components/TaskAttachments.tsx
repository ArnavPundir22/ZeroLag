import React from 'react';
import { Paperclip, UploadCloud, File, Download, Trash2 } from 'lucide-react';

interface TaskAttachmentsProps {
  task: any;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveAttachment: (attachmentId: string) => void;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ task, handleFileUpload, handleRemoveAttachment }) => {
  return (
    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5" /> Attachments
        </h3>
        <label className="cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-white flex items-center gap-1.5 shadow-sm border border-white/10 hover:border-white/20">
          <UploadCloud className="w-3.5 h-3.5" />
          Upload File
          <input type="file" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {(!task.attachments || task.attachments.length === 0) ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-xl bg-black/10">
          <Paperclip className="w-6 h-6 text-text-secondary/50 mb-2" />
          <span className="text-sm font-medium text-text-secondary">No attachments yet.</span>
          <span className="text-xs text-text-secondary/50 mt-1">Upload a file up to 50MB.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {task.attachments.map((file: any) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl hover:border-white/20 transition-all group">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center shrink-0 border border-accent/30 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]">
                  <File className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm text-white font-medium truncate">{file.name}</span>
                  <span className="text-[10px] text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={file.data.startsWith('http') ? `${file.data}?download=${encodeURIComponent(file.name)}` : file.data} 
                  download={file.name}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => handleRemoveAttachment(file.id)}
                  className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
