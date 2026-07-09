import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../store';
import { useDatabase } from '../../../db/DatabaseProvider';
import { X, Calendar, Tag, AlertCircle, MessageSquare, Send, Trash2, Paperclip, Download, UploadCloud, File } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const TaskDetailsPanel: React.FC = () => {
  const selectedTaskId = useAppStore(state => state.selectedTaskId);
  const setSelectedTaskId = useAppStore(state => state.setSelectedTaskId);
  const currentBoardId = useAppStore(state => state.currentBoardId);
  const db = useDatabase();
  
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);

  const [newComment, setNewComment] = useState('');
  const [isPreview, setIsPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [localTitle, setLocalTitle] = useState('');
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [localDescription, setLocalDescription] = useState('');
  const [isDescFocused, setIsDescFocused] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!selectedTaskId || !db || !currentBoardId) {
      setTask(null);
      setComments([]);
      setColumns([]);
      return;
    }

    const sub = db.tasks.findOne({ selector: { id: selectedTaskId } }).$.subscribe((doc: any) => {
      if (doc) setTask(doc.toJSON());
    });

    const cSub = db.comments.find({ selector: { taskId: selectedTaskId }, sort: [{ createdAt: 'asc' }] }).$.subscribe((docs: any[]) => {
      setComments(docs.map((d: any) => d.toJSON()));
    });
    
    const colSub = db.columns.find({ selector: { boardId: currentBoardId }, sort: [{ position: 'asc' }] }).$.subscribe((cols: any[]) => {
      setColumns(cols.map((c: any) => c.toJSON()));
    });

    return () => {
      sub.unsubscribe();
      cSub.unsubscribe();
      colSub.unsubscribe();
    };
  }, [selectedTaskId, db, currentBoardId]);

  useHotkeys('esc', () => setSelectedTaskId(null), { enableOnFormTags: true });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task || !db) return;
    try {
      await db.comments.insert({
        id: uuidv4(),
        taskId: task.id,
        text: newComment.trim(),
        author: 'You',
        createdAt: new Date().toISOString(),
        version: 1,
        deviceId: 'local'
      });
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const updateField = async (field: string, value: any) => {
    if (!task || !db) return;
    try {
      const doc = await db.tasks.findOne({ selector: { id: task.id } }).exec();
      if (doc) {
        await doc.patch({
          [field]: value,
          updatedAt: new Date().toISOString()
        });
        
        let desc = '';
        if (field === 'priority') desc = `Changed priority to ${value}`;
        else if (field === 'dueDate') desc = `Set due date to ${value}`;
        else if (field === 'title') desc = `Renamed task`;
        else if (field === 'labels') desc = `Updated labels`;
        else if (field === 'description') desc = `Updated description`;
        else if (field === 'columnId') {
           const col = columns.find(c => c.id === value);
           desc = `Moved to ${col?.title || 'another column'}`;
        }
        
        if (desc) {
          await db.activities.insert({
            id: uuidv4(),
            taskId: task.id,
            type: 'updated',
            description: desc,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async () => {
    if (!task || !db) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const doc = await db.tasks.findOne({ selector: { id: task.id } }).exec();
        if (doc) {
          await doc.remove();
          setSelectedTaskId(null);
        }
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task || !db) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('File is too large. Maximum size is 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      const newAttachment = {
        id: uuidv4(),
        name: file.name,
        size: file.size,
        mimeType: file.type,
        data: base64Data,
      };

      try {
        const doc = await db.tasks.findOne({ selector: { id: task.id } }).exec();
        if (doc) {
          const currentAttachments = doc.attachments || [];
          await doc.patch({
            attachments: [...currentAttachments, newAttachment],
            updatedAt: new Date().toISOString()
          });

          await db.activities.insert({
            id: uuidv4(),
            taskId: task.id,
            type: 'uploaded',
            description: `Attached file ${file.name}`,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Failed to upload file:', err);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!task || !db) return;
    try {
      const doc = await db.tasks.findOne({ selector: { id: task.id } }).exec();
      if (doc) {
        const currentAttachments = doc.attachments || [];
        const fileRemoved = currentAttachments.find((a: any) => a.id === attachmentId);
        await doc.patch({
          attachments: currentAttachments.filter((a: any) => a.id !== attachmentId),
          updatedAt: new Date().toISOString()
        });

        if (fileRemoved) {
          await db.activities.insert({
            id: uuidv4(),
            taskId: task.id,
            type: 'deleted',
            description: `Removed file ${fileRemoved.name}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('Failed to remove attachment:', err);
    }
  };



  const getPriorityColors = (p: string) => {
    if (p === 'urgent') return 'text-red-400 border-red-500/50 shadow-[0_0_12px_rgba(248,113,113,0.3)] bg-red-500/10';
    if (p === 'high') return 'text-orange-400 border-orange-500/50 shadow-[0_0_12px_rgba(251,146,60,0.3)] bg-orange-500/10';
    if (p === 'normal') return 'text-blue-400 border-blue-500/50 shadow-[0_0_12px_rgba(96,165,250,0.3)] bg-blue-500/10';
    if (p === 'low') return 'text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(52,211,153,0.3)] bg-emerald-500/10';
    return 'text-text-secondary border-border bg-surface-hover';
  };

  return (
    <AnimatePresence>
      {selectedTaskId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-40"
            onClick={() => setSelectedTaskId(null)}
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 md:top-4 md:bottom-4 md:right-4 h-[92vh] md:h-auto w-full md:w-[480px] bg-surface/80 backdrop-blur-2xl border border-white/10 z-50 flex flex-col shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden"
          >
            {isMobile && (
              <div className="w-full flex justify-center py-3 shrink-0">
                <div className="w-12 h-1.5 bg-border rounded-full" />
              </div>
            )}
            
            <div className={`flex items-center justify-between px-6 pb-4 pt-4 border-b border-border/50`}>
              <span className="text-text-secondary text-sm font-bold uppercase tracking-widest">Task Inspector</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleDeleteTask}
                  className="text-text-secondary hover:text-red-400 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-red-500/10 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedTaskId(null)}
                  className="text-text-secondary hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {task ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Editable Title */}
                <div className="px-6 pt-6 pb-4">
                  <textarea
                    value={isTitleFocused ? localTitle : task.title}
                    onFocus={() => { setIsTitleFocused(true); setLocalTitle(task.title); }}
                    onBlur={() => setIsTitleFocused(false)}
                    onChange={(e) => {
                      setLocalTitle(e.target.value);
                      updateField('title', e.target.value);
                    }}
                    placeholder="Task Title"
                    className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none resize-none placeholder-text-secondary/50 leading-tight"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-6 px-6 pt-2 pb-4 border-b border-border/50">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-2 text-sm font-semibold transition-colors relative ${activeTab === 'details' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}
                  >
                    Details
                    {activeTab === 'details' && <motion.div layoutId="activeTab" className="absolute -bottom-4 left-0 right-0 h-[2px] bg-accent" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-2 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${activeTab === 'comments' ? 'text-accent' : 'text-text-secondary hover:text-white'}`}
                  >
                    Comments
                    <span className="bg-white/10 text-[10px] px-1.5 py-0.5 rounded-full text-white">{comments.length}</span>
                    {activeTab === 'comments' && <motion.div layoutId="activeTab" className="absolute -bottom-4 left-0 right-0 h-[2px] bg-accent" />}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {activeTab === 'details' && (
                    <div className="p-6 space-y-8">
                      {/* Meta Fields */}
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
                      
                      {/* Labels */}
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

                      {/* Description */}
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

                      {/* Attachments */}
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
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a 
                                    href={file.data} 
                                    download={file.name}
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
                    </div>
                  )}

                  {activeTab === 'comments' && (
                    <div className="h-full flex flex-col p-6">
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 mb-4">
                        {comments.map(comment => {
                          const isYou = comment.author === 'You';
                          return (
                            <div key={comment.id} className={`flex gap-3 items-end ${isYou ? 'flex-row-reverse' : ''}`}>
                              {!isYou && (
                                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0 uppercase border border-accent/30 shadow-[inset_0_0_8px_rgba(99,102,241,0.2)]">
                                  {comment.author.slice(0, 2)}
                                </div>
                              )}
                              <div className={`flex flex-col ${isYou ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                <div className="flex items-center gap-2 mb-1 px-1">
                                  <span className="font-semibold text-white text-[11px]">{isYou ? 'You' : comment.author}</span>
                                  <span className="text-[10px] text-text-secondary">{new Date(comment.createdAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                                </div>
                                <div className={`p-3 text-sm relative shadow-lg ${isYou ? 'bg-gradient-to-br from-accent to-purple-600 text-white rounded-2xl rounded-br-sm' : 'bg-white/10 border border-white/5 text-white rounded-2xl rounded-bl-sm backdrop-blur-md'}`}>
                                  <p className="whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {comments.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-40 text-text-secondary">
                            <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-sm font-medium">No comments yet.</p>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleAddComment} className="mt-auto relative">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full bg-black/40 border border-white/10 rounded-full pl-5 pr-14 py-3.5 text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-inner transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-accent text-white p-2.5 rounded-full hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-accent/30 flex items-center justify-center"
                        >
                          <Send className="w-4 h-4 ml-0.5" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
                Task not found.
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
