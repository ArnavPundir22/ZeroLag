import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { useAppStore } from '../store';

export const importTimetable = async (userId: string) => {
  if (!userId) {
    useAppStore.getState().setGlobalToastMessage("Please log in to create a timetable.");
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
    useAppStore.getState().setGlobalToastMessage("Failed to create timetable. See console for details.");
    return false;
  }
};

export const importDynamicTimetable = async (userId: string, timetableData: any[]) => {
  if (!userId) {
    useAppStore.getState().setGlobalToastMessage("Please log in to import a timetable.");
    return false;
  }

  try {
    const db = await getDatabase(userId);
    
    // Create new Board
    const boardId = uuidv4();
    await db.boards.insert({
      id: boardId,
      workspaceId: 'default',
      title: 'AI Generated Timetable',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    for (let i = 0; i < timetableData.length; i++) {
      const dayData = timetableData[i];
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
          description: task.description || '',
          priority: task.priority || 'normal',
          labels: task.labels || [],
          dueDate: task.dueDate || '',
          position: j * 1000,
          updatedAt: new Date().toISOString(),
          version: 1,
          deviceId: 'local',
          attachments: []
        });
      }
    }

    useAppStore.getState().setCurrentBoardId(boardId);
    useAppStore.getState().setGlobalToastMessage('AI Timetable generated successfully!');
    
    return true;
  } catch (error) {
    console.error("Failed to import dynamic timetable:", error);
    useAppStore.getState().setGlobalToastMessage("Failed to create AI timetable. See console for details.");
    return false;
  }
};
