import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { useAppStore } from '../store';
import { timetableData } from './timetableData';

export const importTimetable = async (userId: string) => {
  if (!userId) {
    alert("Please log in to import timetable.");
    return;
  }

  try {
    const db = await getDatabase(userId);
    
    // Create new Board
    const boardId = uuidv4();
    await db.boards.insert({
      id: boardId,
      workspaceId: 'default',
      title: 'Semester 5 Timetable',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create Columns and Tasks
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

    // Set active board
    useAppStore.getState().setCurrentBoardId(boardId);
    useAppStore.getState().setGlobalToastMessage('Timetable imported successfully!');
    
    return true;
  } catch (error) {
    console.error("Failed to import timetable:", error);
    alert("Failed to import timetable. See console for details.");
    return false;
  }
};
