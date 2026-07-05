import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { useDatabase } from '../db/DatabaseProvider';
import { X, Calendar, Tag, AlertCircle, Clock, MessageSquare, Send, Trash2 } from 'lucide-react';
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
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
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

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Comments
                  </h3>
                  
                  <div className="space-y-4 mb-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="bg-surface-hover/50 p-3 rounded-lg text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-text-primary">{comment.author}</span>
                          <span className="text-xs text-text-secondary">{new Date(comment.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-text-secondary whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-text-secondary text-xs italic">No comments yet. Be the first!</p>
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-surface-hover border border-border rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="bg-accent text-white p-2 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                <div className="h-px bg-border w-full" />

                {/* Activity Feed */}
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Activity
                  </h3>
                  <div className="text-xs text-text-secondary space-y-3">
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent/50 mt-1 shrink-0" />
                      <div>
                        <p>Task updated</p>
                        <span className="opacity-50">{new Date(task.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    {activities.map(activity => (
                      <div key={activity.id} className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-border mt-1 shrink-0" />
                        <div>
                          <p>{activity.description}</p>
                          <span className="opacity-50">{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
