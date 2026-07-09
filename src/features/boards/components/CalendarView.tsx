import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../../db/DatabaseProvider';
import { useAppStore } from '../../../store';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const db = useDatabase();
  const currentBoardId = useAppStore(state => state.currentBoardId);
  const setSelectedTaskId = useAppStore(state => state.setSelectedTaskId);
  const filterPriorities = useAppStore(state => state.filterPriorities);
  const filterLabels = useAppStore(state => state.filterLabels);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!currentBoardId || !db) return;

    // Fetch columns for this board first to filter tasks
    const colSub = db.columns.find({ selector: { boardId: currentBoardId } }).$.subscribe((cols: any[]) => {
      setColumns(cols.map(c => c.toJSON()));
      
      const colIds = cols.map(c => c.id);
      if (colIds.length > 0) {
        // Fetch tasks
        const taskSub = db.tasks.find({ selector: { columnId: { $in: colIds } } }).$.subscribe((docs: any[]) => {
          let loadedTasks = docs.map((d: any) => d.toJSON());
          
          if (filterPriorities.length > 0) {
            loadedTasks = loadedTasks.filter(t => filterPriorities.includes(t.priority));
          }
          if (filterLabels.length > 0) {
            loadedTasks = loadedTasks.filter(t => t.labels?.some((l: string) => filterLabels.includes(l)));
          }
          
          setTasks(loadedTasks);
        });
        return () => taskSub.unsubscribe();
      } else {
        setTasks([]);
      }
    });

    return () => colSub.unsubscribe();
  }, [currentBoardId, db, filterPriorities, filterLabels]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  
  const days = [];
  // Empty cells for days before the 1st
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper to check if a task falls on a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const tDate = new Date(t.dueDate);
      return tDate.getDate() === date.getDate() && 
             tDate.getMonth() === date.getMonth() && 
             tDate.getFullYear() === date.getFullYear();
    });
  };

  const getPriorityColor = (p: string) => {
    if (p === 'urgent') return 'bg-red-500 text-white';
    if (p === 'high') return 'bg-orange-500 text-white';
    if (p === 'normal') return 'bg-blue-500 text-white';
    if (p === 'low') return 'bg-emerald-500 text-white';
    return 'bg-surface-hover text-text-primary border border-border';
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-background relative isolate">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 gap-4 border-b border-white/5 bg-surface/30 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shadow-lg shrink-0">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            {monthNames[month]} {year}
          </h2>
        </div>
        <div className="flex gap-2 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
          <button onClick={prevMonth} className="p-2 sm:p-2.5 rounded-lg bg-surface hover:bg-surface-hover border border-white/5 text-text-secondary hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-lg bg-surface hover:bg-surface-hover border border-white/5 text-text-secondary hover:text-white transition-colors flex-1 sm:flex-none">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 sm:p-2.5 rounded-lg bg-surface hover:bg-surface-hover border border-white/5 text-text-secondary hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar p-2 sm:p-6">
        <div className="bg-surface/40 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-full min-w-[700px] lg:min-w-0">
          {/* Day Names */}
          <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
            {dayNames.map(name => (
              <div key={name} className="py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-wider sm:tracking-widest">
                {name}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="border-r border-b border-white/5 bg-black/10 min-h-[120px]" />;
              }

              const isToday = new Date().toDateString() === date.toDateString();
              const dayTasks = getTasksForDate(date);

              return (
                <div key={date.toISOString()} className={`border-r border-b border-white/5 min-h-[100px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col gap-1 sm:gap-2 transition-colors hover:bg-white/[0.02] ${isToday ? 'bg-accent/5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-text-secondary'}`}>
                      {date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-text-secondary bg-black/20 px-1.5 py-0.5 rounded border border-white/5">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1">
                    {dayTasks.map(task => {
                      const isDone = columns.find(c => c.id === task.columnId)?.title.toLowerCase().includes('done');
                      
                      return (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs cursor-pointer truncate transition-all shadow-sm ${
                            isDone 
                              ? 'bg-black/20 border border-white/5 text-text-secondary line-through'
                              : getPriorityColor(task.priority)
                          }`}
                        >
                          <div className="font-semibold truncate">{task.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
