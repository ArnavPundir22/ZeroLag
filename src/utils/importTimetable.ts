import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import { useAppStore } from '../store';

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
