import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { useDatabase } from '../../db/DatabaseProvider';
import { Search, X } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';

export const SearchOverlay: React.FC = () => {
  const isSearchOpen = useAppStore(state => state.isSearchOpen);
  const setIsSearchOpen = useAppStore(state => state.setIsSearchOpen);
  const setSelectedTaskId = useAppStore(state => state.setSelectedTaskId);
  const db = useDatabase();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  // Toggle search with Cmd+K or Ctrl+K
  useHotkeys('meta+k, ctrl+k', (e) => {
    e.preventDefault();
    setIsSearchOpen(true);
  }, { enableOnFormTags: true });

  useHotkeys('esc', () => {
    setIsSearchOpen(false);
  }, { enableOnFormTags: true });

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!db || !query.trim()) {
      setResults([]);
      return;
    }

    // RxDB doesn't have full-text search built-in without plugins,
    // so for a small local-first app, we fetch all tasks and filter in memory,
    // or use Mango queries with regex. We'll use regex for simplicity.
    const sub = db.tasks.find({
      selector: {
        title: {
          $regex: new RegExp(query, 'i')
        }
      },
      limit: 10
    }).$.subscribe((docs: any[]) => {
      setResults(docs.map((d: any) => d.toJSON()));
    });

    return () => sub.unsubscribe();
  }, [query, db]);

  const handleSelectTask = (taskId: string) => {
    setIsSearchOpen(false);
    setSelectedTaskId(taskId);
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 sm:px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl relative overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-text-secondary mr-3" />
              <input
                autoFocus
                type="text"
                placeholder="Search tasks by title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-text-primary text-base focus:outline-none placeholder-text-secondary"
              />
              <button onClick={() => setIsSearchOpen(false)} className="text-text-secondary hover:text-text-primary p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {query.trim() && (
              <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
                {results.length > 0 ? (
                  <div className="space-y-1">
                    {results.map(task => (
                      <button
                        key={task.id}
                        onClick={() => handleSelectTask(task.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-hover text-left transition-colors group"
                      >
                        <div>
                          <div className="text-text-primary font-medium text-sm">{task.title}</div>
                          {task.description && (
                            <div className="text-text-secondary text-xs truncate mt-0.5 max-w-md">
                              {task.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {task.priority && (
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              task.priority === 'urgent' ? 'text-red-400 bg-red-400/10' :
                              task.priority === 'high' ? 'text-orange-400 bg-orange-400/10' :
                              task.priority === 'normal' ? 'text-blue-400 bg-blue-400/10' :
                              'text-emerald-400 bg-emerald-400/10'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                          <div className="text-text-secondary text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Jump to →
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-text-secondary text-sm">
                    No tasks found matching "{query}"
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-surface-hover/50 px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <kbd className="bg-background border border-border rounded px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>
                <kbd className="bg-background border border-border rounded px-1.5 py-0.5 font-mono text-[10px]">↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="bg-background border border-border rounded px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="bg-background border border-border rounded px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
