import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Italic, Link as LinkIcon, Code, List, ListOrdered, Download, Heading } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { useAppStore } from '../../../store';

interface TaskDescriptionProps {
  task: any;
  updateField: (field: string, value: any) => void;
}

export const TaskDescription: React.FC<TaskDescriptionProps> = ({ task, updateField }) => {
  const [isPreview, setIsPreview] = useState(true);
  const [localDescription, setLocalDescription] = useState('');
  const [isDescFocused, setIsDescFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const setGlobalToastMessage = useAppStore(state => state.setGlobalToastMessage);

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = isDescFocused ? localDescription : (task.description || '');
    
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    
    setLocalDescription(newText);
    updateField('description', newText);
    
    // Focus and reset selection after React renders
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleDownloadPDF = () => {
    if (!previewRef.current) {
      alert('Please switch to Preview mode to download the PDF.');
      setIsPreview(true);
      return;
    }

    const contentHtml = previewRef.current.innerHTML;
    setGlobalToastMessage('Preparing PDF download. Please wait while the background process takes place.');

    setTimeout(() => {

    const htmlString = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Task: ${task.title || 'Description'}</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: sans-serif; color: black; background: white; line-height: 1.6; }
          h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px; }
          h2 { font-size: 20px; margin-top: 16px; margin-bottom: 8px; }
          h3 { font-size: 18px; margin-top: 16px; margin-bottom: 8px; }
          p { font-size: 14px; margin-bottom: 12px; }
          ul { list-style-type: disc; margin-left: 20px; margin-bottom: 12px; }
          ol { list-style-type: decimal; margin-left: 20px; margin-bottom: 12px; }
          li { margin-bottom: 4px; font-size: 14px; }
          pre { background: #f1f5f9; padding: 12px; border-radius: 4px; margin-bottom: 12px; font-family: monospace; white-space: pre-wrap; font-size: 13px; border: 1px solid #e2e8f0; }
          code { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 2px; font-size: 13px; border: 1px solid #e2e8f0; }
          blockquote { border-left: 4px solid #cbd5e1; padding-left: 12px; margin-left: 0; color: #475569; font-style: italic; }
          a { color: #2563eb; text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>${task.title || 'Task Description'}</h1>
        <div>
          ${contentHtml}
        </div>
        <script>
          // Automatically trigger print dialog when window loads
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlString);
      printWindow.document.close();
    } else {
      alert('Please allow popups to download the PDF.');
    }
    }, 1000);
  };

  return (
    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-secondary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          Description
          {isPreview && task.description && (
            <button 
              onClick={handleDownloadPDF}
              className="text-text-secondary hover:text-accent transition-colors flex items-center gap-1 bg-surface hover:bg-surface-hover px-2 py-1 rounded"
              title="Download as PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </h3>
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
      
      {!isPreview && (
        <div className="flex items-center gap-1 mb-2 bg-surface/50 p-1.5 rounded-lg border border-border">
          <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded transition-colors" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => insertMarkdown('_', '_')} className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded transition-colors" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1"></div>
          <button onClick={() => insertMarkdown('### ')} className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded transition-colors" title="Heading">
            <Heading className="w-4 h-4" />
          </button>
          <button onClick={() => insertMarkdown('- ')} className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded transition-colors" title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => insertMarkdown('1. ')} className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded transition-colors" title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1"></div>
          <button onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded transition-colors" title="Link">
            <LinkIcon className="w-4 h-4" />
          </button>
          <button onClick={() => insertMarkdown('`', '`')} className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded transition-colors" title="Code">
            <Code className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isPreview ? (
        <textarea
          ref={textareaRef}
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
          ref={previewRef}
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
