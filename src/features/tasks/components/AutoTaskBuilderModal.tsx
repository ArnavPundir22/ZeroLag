import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, FileText, UploadCloud, CheckCircle2, AlertCircle, Trash2, Tag, Calendar, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { useSession } from '@clerk/react';
import { parseTasksFromContent, type ParsedTask } from '../../../utils/aiTaskParser';
import { useDatabase } from '../../../db/DatabaseProvider';
import { v4 as uuidv4 } from 'uuid';

interface AutoTaskBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: any[];
}

const SAMPLE_MARKDOWN = `# Authentication & User Management Sprint

## High Priority Requirements
- [ ] **Setup Clerk Authentication Provider**
  - Implement login and sign up buttons in navbar
  - Configure protected routes for dashboard and board pages
  - Priority: Urgent | Tag: Auth, Security

- [ ] **User Profile Dropdown Component**
  - Display avatar image, full name, and email address
  - Add quick link to user settings and logout action
  - Target deadline: 2026-09-15 | Tag: UI, Frontend

## Database & Syncing
- [ ] **RxDB Local Sync Engine Optimization**
  - Audit database indexes for fast task search
  - Implement fallback handling when server is offline
  - Priority: High | Tag: Database, Sync

## Documentation
- [ ] **Write API Documentation in README.md**
  - Document Gemini AI task parsing endpoint
  - Add environment variable configuration instructions
`;

export const AutoTaskBuilderModal: React.FC<AutoTaskBuilderModalProps> = ({ isOpen, onClose, columns }) => {
  const { session } = useSession();
  const db = useDatabase();

  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedDefaultColumn, setSelectedDefaultColumn] = useState<string>('');
  
  const [parsedTasks, setParsedTasks] = useState<(ParsedTask & { selected: boolean; targetColumnId: string })[]>([]);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Analyzing text and markdown structure...",
    "Extracting actionable user stories & tasks...",
    "Assigning intelligent priorities & labels...",
    "Preparing task preview cards...",
    "Almost ready..."
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'processing') {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setInputText('');
      setCustomPrompt('');
      setParsedTasks([]);
      setError(null);
      if (columns.length > 0) {
        setSelectedDefaultColumn(columns[0].id);
      }
    }
  }, [isOpen, columns]);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt') && !file.type.includes('text')) {
      setError("Please upload a .md or .txt text file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setInputText(text);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError("Please enter or paste text/markdown content first.");
      return;
    }

    try {
      setError(null);
      setStep('processing');

      const token = (await session?.getToken()) || '';
      const columnNames = columns.map(c => c.title);

      const tasks = await parseTasksFromContent(inputText, token, columnNames, customPrompt);

      if (!tasks || tasks.length === 0) {
        throw new Error("No tasks could be extracted from the content provided.");
      }

      // Map parsed tasks with default selected state and column matching
      const mapped = tasks.map(t => {
        let colId = selectedDefaultColumn || (columns[0]?.id || '');
        if (t.suggestedColumn) {
          const matchedCol = columns.find(c => c.title.toLowerCase().trim() === t.suggestedColumn?.toLowerCase().trim());
          if (matchedCol) colId = matchedCol.id;
        }
        return {
          ...t,
          selected: true,
          targetColumnId: colId
        };
      });

      setParsedTasks(mapped);
      setStep('review');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate tasks using Gemini AI.");
      setStep('input');
    }
  };

  const handleCreateSelected = async () => {
    const tasksToCreate = parsedTasks.filter(t => t.selected);
    if (tasksToCreate.length === 0) return;

    try {
      const now = new Date().toISOString();
      
      for (const t of tasksToCreate) {
        const taskId = uuidv4();
        // Calculate position based on existing tasks in the target column
        const columnTasks = await db.tasks.find({ selector: { columnId: t.targetColumnId } }).exec();
        const position = columnTasks.length;

        await db.tasks.insert({
          id: taskId,
          columnId: t.targetColumnId,
          title: t.title.trim(),
          description: t.description || '',
          priority: t.priority || 'medium',
          labels: Array.isArray(t.labels) ? t.labels : [],
          dueDate: t.dueDate || '',
          position,
          updatedAt: now,
          version: 1,
          deviceId: 'local'
        });

        await db.activities.insert({
          id: uuidv4(),
          taskId,
          type: 'created',
          description: 'Auto-generated by Gemini AI Task Builder',
          timestamp: now
        });
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Failed to create tasks in database: " + err.message);
    }
  };

  const toggleSelectAll = () => {
    const allSelected = parsedTasks.every(t => t.selected);
    setParsedTasks(prev => prev.map(t => ({ ...t, selected: !allSelected })));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-panel border border-border shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-text-primary"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  AI Auto Task Builder
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                    Gemini 2.5 Flash
                  </span>
                </h2>
                <p className="text-xs text-text-secondary">
                  Paste Markdown or plain text content to instantly generate Kanban task cards
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* STEP 1: INPUT STAGE */}
            {step === 'input' && (
              <div className="space-y-5">
                {/* Header Action bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface border border-border/60 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold">Content Source</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setInputText(SAMPLE_MARKDOWN)}
                      className="px-3 py-1.5 text-xs font-medium bg-surface-hover hover:bg-surface-hover/80 text-text-primary rounded-lg border border-border transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      Try Sample Markdown
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium bg-surface-hover hover:bg-surface-hover/80 text-text-primary rounded-lg border border-border transition-colors flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                      Upload File (.md, .txt)
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".md,.txt,text/plain,text/markdown"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste PRD notes, meeting action items, project specifications, or markdown checklist here..."
                    className="w-full h-56 bg-surface/40 border border-border focus:border-accent rounded-xl p-4 text-sm font-mono text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent/50 custom-scrollbar resize-none"
                  />
                  {inputText && (
                    <span className="absolute bottom-3 right-3 text-xs text-text-secondary bg-surface/80 px-2 py-1 rounded-md border border-border font-mono">
                      {inputText.length} chars
                    </span>
                  )}
                </div>

                {/* Options grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Default Target Column
                    </label>
                    <select
                      value={selectedDefaultColumn}
                      onChange={(e) => setSelectedDefaultColumn(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    >
                      {columns.map(col => (
                        <option key={col.id} value={col.id}>
                          {col.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Custom Prompt / AI Guidance (Optional)
                    </label>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g., Focus on backend engineering subtasks with high priority"
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PROCESSING STAGE */}
            {step === 'processing' && (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 border-r-purple-500 flex items-center justify-center bg-surface relative z-10 shadow-xl"
                  >
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </motion.div>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Generating Task Cards</h3>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMsgIdx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-text-secondary text-sm font-medium h-6"
                  >
                    {loadingMessages[loadingMsgIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}

            {/* STEP 3: REVIEW & EDIT STAGE */}
            {step === 'review' && (
              <div className="space-y-4">
                {/* Header Controls */}
                <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-xs font-semibold text-text-primary hover:text-accent transition-colors"
                    >
                      {parsedTasks.every(t => t.selected) ? (
                        <CheckSquare className="w-4 h-4 text-accent" />
                      ) : (
                        <Square className="w-4 h-4 text-text-secondary" />
                      )}
                      <span>
                        {parsedTasks.filter(t => t.selected).length} of {parsedTasks.length} Selected
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={() => setStep('input')}
                    className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border hover:bg-surface-hover"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Edit Content / Re-parse
                  </button>
                </div>

                {/* Parsed Tasks List */}
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                  {parsedTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 transition-all ${
                        task.selected
                          ? 'bg-surface/80 border-accent/40 shadow-sm'
                          : 'bg-surface/20 border-border/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={task.selected}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setParsedTasks(prev => prev.map((t, i) => i === idx ? { ...t, selected: val } : t));
                          }}
                          className="mt-1.5 h-4 w-4 rounded border-border text-accent focus:ring-accent bg-surface cursor-pointer"
                        />
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedTasks(prev => prev.map((t, i) => i === idx ? { ...t, title: val } : t));
                              }}
                              className="font-semibold text-sm text-text-primary bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none w-full"
                            />
                            
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Priority Dropdown */}
                              <select
                                value={task.priority}
                                onChange={(e) => {
                                  const val = e.target.value as any;
                                  setParsedTasks(prev => prev.map((t, i) => i === idx ? { ...t, priority: val } : t));
                                }}
                                className={`text-xs px-2 py-1 rounded-lg border font-bold capitalize focus:outline-none ${
                                  task.priority === 'urgent' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                  task.priority === 'high' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
                                  task.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                  'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                }`}
                              >
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>

                              {/* Column Dropdown */}
                              <select
                                value={task.targetColumnId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setParsedTasks(prev => prev.map((t, i) => i === idx ? { ...t, targetColumnId: val } : t));
                                }}
                                className="text-xs px-2 py-1 rounded-lg border border-border bg-surface text-text-secondary focus:outline-none"
                              >
                                {columns.map(col => (
                                  <option key={col.id} value={col.id}>{col.title}</option>
                                ))}
                              </select>

                              <button
                                onClick={() => setParsedTasks(prev => prev.filter((_, i) => i !== idx))}
                                className="text-text-secondary hover:text-red-400 p-1 rounded-md transition-colors"
                                title="Remove task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <textarea
                              value={task.description}
                              rows={2}
                              onChange={(e) => {
                                const val = e.target.value;
                                setParsedTasks(prev => prev.map((t, i) => i === idx ? { ...t, description: val } : t));
                              }}
                              className="w-full text-xs text-text-secondary bg-surface/40 border border-border/50 rounded-lg p-2 focus:outline-none focus:border-accent custom-scrollbar resize-y"
                            />
                          )}

                          {/* Labels & Date */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary pt-1">
                            {task.labels && task.labels.map((lbl, lIdx) => (
                              <span key={lIdx} className="bg-surface-hover text-text-secondary border border-border/60 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
                                <Tag className="w-3 h-3 text-accent" />
                                {lbl}
                              </span>
                            ))}
                            {task.dueDate && (
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
                                <Calendar className="w-3 h-3" />
                                {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>

            {step === 'input' && (
              <button
                onClick={handleGenerate}
                disabled={!inputText.trim()}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                Generate Tasks with Gemini
              </button>
            )}

            {step === 'review' && (
              <button
                onClick={handleCreateSelected}
                disabled={parsedTasks.filter(t => t.selected).length === 0}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                Add {parsedTasks.filter(t => t.selected).length} Tasks to Board
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
