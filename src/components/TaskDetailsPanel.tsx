import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { useDatabase } from '../db/DatabaseProvider';
import { X, Calendar, Tag, AlertCircle, MessageSquare, Send, Trash2, Paperclip, Download } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const TaskDetailsPanel: React.FC = () => {
  const selectedTaskId = useAppStore(state => state.selectedTaskId);
  const setSelectedTaskId = useAppStore(state => state.setSelectedTaskId);
  const db = useDatabase();
  
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPreview, setIsPreview] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

  useEffect(() => {
    if (!selectedTaskId || !db) {
      setTask(null);
      setComments([]);
      setActivities([]);
      return;
    }

    const sub = db.tasks.findOne({ selector: { id: selectedTaskId } }).$.subscribe((doc: any) => {
      if (doc) setTask(doc.toJSON());
    });

    const cSub = db.comments.find({ selector: { taskId: selectedTaskId }, sort: [{ createdAt: 'asc' }] }).$.subscribe((docs: any[]) => {
      setComments(docs.map((d: any) => d.toJSON()));
    });

    const aSub = db.activities.find({ selector: { taskId: selectedTaskId }, sort: [{ timestamp: 'desc' }] }).$.subscribe((docs: any[]) => {
      setActivities(docs.map((d: any) => d.toJSON()));
    });

    return () => {
      sub.unsubscribe();
      cSub.unsubscribe();
      aSub.unsubscribe();
    };
  }, [selectedTaskId, db]);

  // Keyboard shortcut to close panel
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task || !db) return;

    // 50MB limit
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit. Please choose a smaller file to ensure offline sync reliability.');
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
        data: base64Data
      };

      const currentAttachments = task.attachments || [];
      const updatedAttachments = [...currentAttachments, newAttachment];
      
      await updateField('attachments', updatedAttachments);
      
      // Also log activity
      await db.activities.insert({
        id: uuidv4(),
        taskId: task.id,
        type: 'updated',
        description: `Attached file: ${file.name}`,
        timestamp: new Date().toISOString()
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  return (
    <AnimatePresence>
      {selectedTaskId && (
        <>
          {/* Backdrop for mobile mostly, but good for focus */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSelectedTaskId(null)}
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:relative right-0 top-0 h-full w-full md:w-[400px] bg-surface border-l border-border z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <span className="text-text-secondary text-sm font-medium">Task Details</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleDeleteTask}
                  className="text-text-secondary hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedTaskId(null)}
                  className="text-text-secondary hover:text-text-primary p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {task ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Tabs */}
                <div className="flex items-center gap-6 px-6 pt-4 border-b border-border">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'details' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Details
                    {activeTab === 'details' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${activeTab === 'comments' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Comments
                    <span className="bg-surface-hover text-[10px] px-1.5 py-0.5 rounded-full text-text-primary">{comments.length}</span>
                    {activeTab === 'comments' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'activity' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Activity
                    {activeTab === 'activity' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {activeTab === 'details' && (
                    <div className="p-6 space-y-8">
                      {/* Title */}
                      <div>
                        <textarea
                          value={task.title}
                          onChange={(e) => updateField('title', e.target.value)}
                          placeholder="Task Title"
                          className="w-full bg-transparent text-xl font-semibold text-text-primary focus:outline-none resize-none placeholder-text-secondary"
                          rows={2}
                        />
                      </div>

                      {/* Meta Fields */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="w-24 text-text-secondary flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Priority
                          </div>
                          <select
                            value={task.priority}
                            onChange={(e) => updateField('priority', e.target.value)}
                            className="bg-surface-hover border border-border rounded-md px-2 py-1 text-text-primary focus:outline-none focus:border-accent flex-1"
                          >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="w-24 text-text-secondary flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Due Date
                          </div>
                          <input
                            type="date"
                            value={task.dueDate || ''}
                            onChange={(e) => updateField('dueDate', e.target.value)}
                            className="bg-surface-hover border border-border rounded-md px-2 py-1 text-text-primary focus:outline-none focus:border-accent flex-1 color-scheme-dark"
                          />
                        </div>
                        
                        <div className="flex items-start gap-4 text-sm">
                          <div className="w-24 text-text-secondary flex items-center gap-2 mt-1">
                            <Tag className="w-4 h-4" /> Labels
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {(task.labels || []).map((label: string, index: number) => (
                                <span key={index} className="bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1">
                                  {label}
                                  <button 
                                    onClick={() => {
                                      const newLabels = task.labels.filter((_: any, i: number) => i !== index);
                                      updateField('labels', newLabels);
                                    }}
                                    className="hover:text-text-primary ml-1"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <input
                              type="text"
                              placeholder="Type label & press Enter..."
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
                              className="w-full bg-surface-hover border border-border rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-border w-full" />

                      {/* Description */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-text-primary">Description</h3>
                          <div className="flex items-center gap-1 bg-surface-hover rounded-md p-0.5">
                            <button 
                              onClick={() => setIsPreview(false)}
                              className={`px-2 py-1 text-[10px] font-medium rounded-sm transition-colors ${!isPreview ? 'bg-background text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setIsPreview(true)}
                              className={`px-2 py-1 text-[10px] font-medium rounded-sm transition-colors ${isPreview ? 'bg-background text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                        
                        {!isPreview ? (
                          <textarea
                            value={task.description || ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            placeholder="Add a more detailed description (Markdown supported)..."
                            className="w-full bg-surface-hover/50 border border-transparent focus:border-accent/50 rounded-lg p-3 text-sm text-text-primary focus:outline-none min-h-[150px] resize-y placeholder-text-secondary/50 font-mono"
                          />
                        ) : (
                          <div 
                            className="w-full bg-surface-hover/30 border border-transparent rounded-lg p-3 text-sm text-text-primary min-h-[150px] markdown-preview"
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

                      <div className="h-px bg-border w-full" />

                      {/* Attachments */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
                            <Paperclip className="w-4 h-4" /> Attachments
                          </h3>
                          <label className="cursor-pointer bg-surface-hover hover:bg-border/50 text-text-primary px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-border/50">
                            Upload File
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={handleFileUpload}
                              accept="image/*,.pdf,.doc,.docx,.txt"
                            />
                          </label>
                        </div>

                        {(task.attachments && task.attachments.length > 0) ? (
                          <div className="grid grid-cols-2 gap-3">
                            {task.attachments.map((attachment: any) => (
                              <div key={attachment.id} className="relative group rounded-lg border border-border/50 overflow-hidden bg-surface-hover/30 aspect-square flex flex-col items-center justify-center">
                                {attachment.mimeType.startsWith('image/') ? (
                                  <img 
                                    src={attachment.data} 
                                    alt={attachment.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="p-4 flex flex-col items-center justify-center text-center">
                                    <Paperclip className="w-8 h-8 text-text-secondary mb-2 opacity-50" />
                                    <span className="text-xs text-text-primary font-medium truncate w-full px-2" title={attachment.name}>{attachment.name}</span>
                                    <span className="text-[10px] text-text-secondary mt-1">{(attachment.size / 1024).toFixed(1)} KB</span>
                                  </div>
                                )}
                                
                                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                                  <a 
                                    href={attachment.data} 
                                    download={attachment.name}
                                    className="bg-surface text-text-primary p-2 rounded-full hover:bg-accent hover:text-white transition-colors shadow-lg"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Remove this attachment?')) {
                                        updateField('attachments', task.attachments.filter((a: any) => a.id !== attachment.id));
                                      }
                                    }}
                                    className="bg-surface text-red-400 p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-lg"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border/60 rounded-xl bg-surface-hover/20">
                            <Paperclip className="w-6 h-6 text-text-secondary opacity-30 mb-2" />
                            <p className="text-sm text-text-secondary">No attachments yet.</p>
                            <p className="text-xs text-text-secondary opacity-50">Upload a file up to 50MB.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'comments' && (
                    <div className="h-full flex flex-col p-6">
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 mb-4">
                        {comments.map(comment => (
                          <div key={comment.id} className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs shrink-0 uppercase border border-accent/30">
                              {comment.author.slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <div className="bg-surface-hover/50 border border-border/50 p-3 rounded-xl rounded-tl-none text-sm shadow-sm relative">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-semibold text-text-primary text-xs">{comment.author}</span>
                                  <span className="text-[10px] text-text-secondary">{new Date(comment.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {comments.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-40 text-text-secondary">
                            <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-sm italic">No comments yet.</p>
                            <p className="text-xs opacity-60">Start the conversation below.</p>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleAddComment} className="flex gap-2 relative mt-auto border-t border-border pt-4">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 bg-surface-hover border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent shadow-sm"
                        />
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="absolute right-2 top-6 bg-accent text-white p-1.5 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="relative pl-3 p-6 h-full overflow-y-auto custom-scrollbar">
                      <div className="absolute left-[39px] top-8 bottom-0 w-px bg-border/50" />
                      <div className="space-y-6">
                        {activities.map((activity, idx) => (
                          <motion.div 
                            key={activity.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative flex gap-4 text-sm"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-surface border-2 border-accent mt-1.5 z-10 shrink-0 shadow-[0_0_0_4px_var(--color-surface)]" />
                            <div className="bg-surface-hover/30 border border-border/50 rounded-lg p-3 flex-1">
                              <p className="text-text-primary mb-1">{activity.description}</p>
                              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                                {new Date(activity.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                        
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: activities.length * 0.05 }}
                          className="relative flex gap-4 text-sm opacity-60"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-surface border-2 border-border mt-1.5 z-10 shrink-0 shadow-[0_0_0_4px_var(--color-surface)]" />
                          <div className="flex-1 py-1">
                            <p className="text-text-secondary">Task created</p>
                            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                              {new Date(task.createdAt || task.updatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      </div>
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
