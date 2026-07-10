import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration-schema';
import { boardSchema, columnSchema, taskSchema, operationSchema, commentSchema, activitySchema, chatMessageSchema } from './schema';
import { v4 as uuidv4 } from 'uuid';

addRxPlugin(RxDBMigrationPlugin);

addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBUpdatePlugin);

let dbPromise: Promise<any> | null = null;
export const resetDatabase = () => { dbPromise = null; };

export const getDatabase = async (userId: string) => {
  if (dbPromise) return dbPromise;
  
  dbPromise = (async () => {
    const db = await createRxDatabase({
      name: `zerolag_${userId}_v3`,
      storage: getRxStorageDexie(),
      multiInstance: true,
      eventReduce: true
    });

    await db.addCollections({
      boards: { 
        schema: boardSchema,
        migrationStrategies: {
          1: function(oldDoc: any) {
            oldDoc.meetCode = oldDoc.meetCode || '';
            return oldDoc;
          }
        }
      },
      columns: { schema: columnSchema },
      tasks: { 
        schema: taskSchema,
        migrationStrategies: {
          1: function(oldDoc: any) {
            oldDoc.assignee = oldDoc.assignee || '';
            return oldDoc;
          }
        }
      },
      operations: { schema: operationSchema },
      comments: { schema: commentSchema },
      activities: { schema: activitySchema },
      chatMessages: { schema: chatMessageSchema }
    });

    // Setup Operation Interceptors
    const collectionsToWatch = ['boards', 'columns', 'tasks', 'comments', 'activities', 'chatMessages'];
    
    const getBoardIdForDoc = async (colName: string, docData: any) => {
      if (colName === 'boards') return docData.id;
      if (colName === 'columns' || colName === 'chatMessages') return docData.boardId;
      if (colName === 'tasks') {
        const col = await db.columns.findOne({ selector: { id: docData.columnId } }).exec();
        return col ? col.boardId : 'unknown';
      }
      if (colName === 'comments' || colName === 'activities') {
        const task = await db.tasks.findOne({ selector: { id: docData.taskId } }).exec();
        if (!task) return 'unknown';
        const col = await db.columns.findOne({ selector: { id: task.columnId } }).exec();
        return col ? col.boardId : 'unknown';
      }
      return 'unknown';
    };
    
    collectionsToWatch.forEach(colName => {
      db[colName].postInsert(async function(docData: any) {
        if ((window as any).__isRemoteSync) return;
        const boardId = await getBoardIdForDoc(colName, docData);
        db.operations.insert({
          id: uuidv4(),
          type: 'CREATE',
          entity: colName.toUpperCase(),
          entityId: docData.id,
          boardId,
          payload: JSON.stringify(docData),
          timestamp: new Date().toISOString(),
          status: 'PENDING'
        });
      }, false);

      db[colName].postSave(async function(docData: any) {
        if ((window as any).__isRemoteSync) return;
        const boardId = await getBoardIdForDoc(colName, docData);
        db.operations.insert({
          id: uuidv4(),
          type: 'UPDATE',
          entity: colName.toUpperCase(),
          entityId: docData.id,
          boardId,
          payload: JSON.stringify(docData),
          timestamp: new Date().toISOString(),
          status: 'PENDING'
        });
      }, false);

      db[colName].postRemove(async function(docData: any) {
        if ((window as any).__isRemoteSync) return;
        const boardId = await getBoardIdForDoc(colName, docData);
        db.operations.insert({
          id: uuidv4(),
          type: 'DELETE',
          entity: colName.toUpperCase(),
          entityId: docData.id,
          boardId,
          payload: '',
          timestamp: new Date().toISOString(),
          status: 'PENDING'
        });
      }, false);
    });

    // No initial seed - users start with empty workspace
    return db;
  })();
  
  return dbPromise;
};
