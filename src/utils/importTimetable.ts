import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { useAppStore } from '../store';
import { sectionATimetable } from './sectionATimetable';

export const importTimetable = async (userId: string) => {
  if (!userId) {
    alert("Please log in to create a timetable.");
    return;
  }

  try {
    const db = await getDatabase(userId);
    
    // Create new Board
    const boardId = uuidv4();
    await db.boards.insert({
      id: boardId,
      workspaceId: 'default',
      title: 'My Timetable',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create Columns for each day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < days.length; i++) {
      const columnId = uuidv4();
      await db.columns.insert({
        id: columnId,
        boardId: boardId,
        title: days[i],
        position: i * 1000
      });
    }

    // Set active board
    useAppStore.getState().setCurrentBoardId(boardId);
    useAppStore.getState().setGlobalToastMessage('Timetable template created successfully!');
    
    return true;
  } catch (error) {
    console.error("Failed to create timetable:", error);
    alert("Failed to create timetable. See console for details.");
    return false;
  }
};

export const seedSectionATimetable = async (userId: string) => {
  if (!userId) return;

  try {
    const db = await getDatabase(userId);
    const boardId = 'sectionA';
    
    // Check if it exists locally first
    const existing = await db.boards.findOne({ selector: { id: boardId } }).exec();
    if (existing) {
      useAppStore.getState().setGlobalToastMessage('Section A board already exists locally.');
      return;
    }

    await db.boards.insert({
      id: boardId,
      workspaceId: 'default',
      title: 'Section A Timetable',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    for (let i = 0; i < sectionATimetable.length; i++) {
      const dayData = sectionATimetable[i];
      const columnId = uuidv4();
      
      await db.columns.insert({
        id: columnId,
        boardId: boardId,
        title: dayData.day,
        position: i * 1000
      });

      for (let j = 0; j < dayData.tasks.length; j++) {
        const task = dayData.tasks[j];
        await db.tasks.insert({
          id: uuidv4(),
          columnId: columnId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          labels: task.labels,
          dueDate: '',
          position: j * 1000,
          updatedAt: new Date().toISOString(),
          version: 1,
          deviceId: 'local',
          attachments: []
        });
      }
    }

    useAppStore.getState().setGlobalToastMessage('Section A successfully seeded! It will sync to cloud.');
  } catch (err) {
    console.error('Seed error:', err);
  }
};
