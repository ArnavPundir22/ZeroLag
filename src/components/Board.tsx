import React, { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Column } from './Column';
import { Task } from './Task';
import { useDatabase } from '../db/DatabaseProvider';
import { useAppStore } from '../store';
import { v4 as uuidv4 } from 'uuid';

export const Board: React.FC = () => {
  const db = useDatabase();
  const currentBoardId = useAppStore(state => state.currentBoardId);
  const filterPriorities = useAppStore(state => state.filterPriorities);
  const filterLabels = useAppStore(state => state.filterLabels);
  
  const [columns, setColumns] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any | null>(null);

  useEffect(() => {
    if (!currentBoardId || !db) return;

    const colSub = db.columns.find({
      selector: { boardId: currentBoardId },
      sort: [{ position: 'asc' }]
    }).$.subscribe((cols: any[]) => {
      setColumns(cols.map((c: any) => c.toJSON()));
    });

    const taskSub = db.tasks.find({
      sort: [{ position: 'asc' }]
    }).$.subscribe((tsks: any[]) => {
      // Filter tasks by columns in this board manually for simplicity,
      // or we can just fetch all tasks. In a real app we'd query by columnIds.
      setTasks(tsks.map((t: any) => t.toJSON()));
    });

    return () => {
      colSub.unsubscribe();
      taskSub.unsubscribe();
    };
  }, [currentBoardId, db]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task);
    } else if (active.data.current?.type === 'Column') {
      // setActiveColumn if we want a drag overlay for columns
    }
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Moving task over another task
    if (isActiveTask && isOverTask) {
      const activeTaskIndex = tasks.findIndex(t => t.id === activeId);
      const overTaskIndex = tasks.findIndex(t => t.id === overId);
      
      const overColumnId = tasks[overTaskIndex].columnId;

      if (tasks[activeTaskIndex].columnId !== overColumnId) {
        setTasks(prev => {
          const newTasks = [...prev];
          newTasks[activeTaskIndex].columnId = overColumnId;
          return arrayMove(newTasks, activeTaskIndex, overTaskIndex);
        });
      } else {
        setTasks(prev => arrayMove(prev, activeTaskIndex, overTaskIndex));
      }
    }

    // Moving task over an empty column
    if (isActiveTask && isOverColumn) {
      const activeTaskIndex = tasks.findIndex(t => t.id === activeId);
      if (tasks[activeTaskIndex].columnId !== overId) {
        setTasks(prev => {
          const newTasks = [...prev];
          newTasks[activeTaskIndex].columnId = overId;
          return arrayMove(newTasks, activeTaskIndex, newTasks.length - 1);
        });
      }
    }
    
    // Moving column over another column
    const isActiveColumn = active.data.current?.type === 'Column';
    if (isActiveColumn && isOverColumn && activeId !== overId) {
      setColumns(prev => {
        const oldIndex = prev.findIndex(c => c.id === activeId);
        const newIndex = prev.findIndex(c => c.id === overId);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    setActiveTask(null);
    const { over } = event;
    if (!over) return;

    // The state was optimistically updated in handleDragOver.
    // Now we persist the order to RxDB.
    const updatedTasks = [...tasks];
    
    try {
      // Re-assign positions based on the new array order to keep it simple.
      // We will batch patch them.
      for (let i = 0; i < updatedTasks.length; i++) {
        const task = updatedTasks[i];
        const doc = await db.tasks.findOne({ selector: { id: task.id } }).exec();
        if (doc && (doc.columnId !== task.columnId || doc.position !== i)) {
          
          const oldColumnId = doc.columnId;
          
          await doc.patch({
            columnId: task.columnId,
            position: i,
            updatedAt: new Date().toISOString()
          });

          // Log activity if column changed
          if (oldColumnId !== task.columnId) {
            const col = columns.find(c => c.id === task.columnId);
            if (col) {
              await db.activities.insert({
                id: uuidv4(),
                taskId: task.id,
                type: 'moved',
                description: `Moved to ${col.title}`,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }

      // Persist Column Order
      const updatedColumns = [...columns];
      for (let i = 0; i < updatedColumns.length; i++) {
        const col = updatedColumns[i];
        const doc = await db.columns.findOne({ selector: { id: col.id } }).exec();
        if (doc && doc.position !== i) {
          await doc.patch({ position: i });
        }
      }
    } catch (err) {
      console.error('Failed to save drag and drop changes:', err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterPriorities.length > 0 && !filterPriorities.includes(t.priority)) return false;
    if (filterLabels.length > 0) {
      if (!t.labels || !Array.isArray(t.labels)) return false;
      const hasMatchingLabel = t.labels.some((l: string) => filterLabels.includes(l));
      if (!hasMatchingLabel) return false;
    }
    return true;
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 w-full overflow-hidden">
        <div className="h-full w-full flex gap-4 sm:gap-6 p-4 sm:p-8 overflow-x-auto items-start snap-x snap-mandatory">
          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map(col => (
              <Column
                key={col.id}
                column={col}
                tasks={filteredTasks.filter(t => t.columnId === col.id)}
              />
            ))}
          </SortableContext>
        </div>
      </div>
      
      <DragOverlay>
        {activeTask ? <Task task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
