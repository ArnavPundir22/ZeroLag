import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../store';
import { useDatabase } from '../../../db/DatabaseProvider';
import { X, Trash2 } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@clerk/react';
import { TaskMetaFields } from './TaskMetaFields';
import { TaskLabels } from './TaskLabels';
import { TaskDescription } from './TaskDescription';
import { TaskAttachments } from './TaskAttachments';
import { TaskComments } from './TaskComments';
export const TaskDetailsPanel: React.FC = () => {
  const selectedTaskId = useAppStore(state => state.selectedTaskId);
  const setSelectedTaskId = useAppStore(state => state.setSelectedTaskId);
  const currentBoardId = useAppStore(state => state.currentBoardId);
  const db = useDatabase();
  const { user } = useUser();
  const currentUserName = user?.fullName || user?.firstName || 'Anonymous';
  
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);

  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [localTitle, setLocalTitle] = useState('');
  const [isTitleFocused, setIsTitleFocused] = useState(false);

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

    const cSub = db.comments.find({ selector: { taskId: selectedTaskId } }).$.subscribe((docs: any[]) => {
      const sorted = docs.map((d: any) => d.toJSON()).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setComments(sorted);
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
        author: currentUserName,
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

    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum size is 10MB.');
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
            className="fixed bottom-0 md:top-4 md:bottom-4 md:right-4 h-[92vh] md:h-auto w-full md:w-[480px] bg-surface/90 backdrop-blur-3xl border border-border z-50 flex flex-col shadow-soft-lg dark:shadow-2xl rounded-t-2xl md:rounded-2xl overflow-hidden"
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
                  className="text-text-secondary hover:text-text-primary p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-surface-hover transition-colors"
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
                    className="w-full bg-transparent text-2xl font-bold text-text-primary focus:outline-none resize-none placeholder-text-secondary/50 leading-tight"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-6 px-6 pt-2 pb-4 border-b border-border/50">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-2 text-sm font-semibold transition-colors relative ${activeTab === 'details' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Details
                    {activeTab === 'details' && <motion.div layoutId="activeTab" className="absolute -bottom-4 left-0 right-0 h-[2px] bg-accent" />}
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-2 text-sm font-semibold transition-colors relative flex items-center gap-1.5 ${activeTab === 'comments' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Comments
                    <span className="bg-border text-[10px] px-1.5 py-0.5 rounded-full text-text-primary">{comments.length}</span>
                    {activeTab === 'comments' && <motion.div layoutId="activeTab" className="absolute -bottom-4 left-0 right-0 h-[2px] bg-accent" />}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {activeTab === 'details' && (
                    <div className="p-6 space-y-8">
                      <TaskMetaFields 
                        task={task} 
                        columns={columns} 
                        updateField={updateField} 
                        getPriorityColors={getPriorityColors} 
                      />
                      
                      <TaskLabels 
                        task={task} 
                        updateField={updateField} 
                      />

                      <TaskDescription 
                        task={task} 
                        updateField={updateField} 
                      />

                      <TaskAttachments 
                        task={task} 
                        handleFileUpload={handleFileUpload} 
                        handleRemoveAttachment={handleRemoveAttachment} 
                      />
                    </div>
                  )}

                  {activeTab === 'comments' && (
                    <TaskComments 
                      comments={comments}
                      currentUserName={currentUserName}
                      newComment={newComment}
                      setNewComment={setNewComment}
                      handleAddComment={handleAddComment}
                    />
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
