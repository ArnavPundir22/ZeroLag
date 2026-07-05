import type { RxJsonSchema } from 'rxdb';

export const boardSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    workspaceId: { type: 'string' },
    title: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' }
  },
  required: ['id', 'title', 'createdAt', 'updatedAt']
};

export const columnSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    boardId: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    position: { type: 'number' }
  },
  required: ['id', 'boardId', 'title', 'position']
};

export const taskSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    columnId: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    description: { type: 'string' },
    priority: { type: 'string' },
    labels: { type: 'array', items: { type: 'string' } },
    dueDate: { type: 'string' },
    position: { type: 'number' },
    updatedAt: { type: 'string' },
    version: { type: 'number' },
    deviceId: { type: 'string' }
  },
  required: ['id', 'columnId', 'title', 'position', 'updatedAt', 'version', 'deviceId']
};

export const operationSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    type: { type: 'string' }, // CREATE, UPDATE, DELETE
    entity: { type: 'string' }, // TASK, COLUMN, BOARD
    entityId: { type: 'string' },
    boardId: { type: 'string' }, // Used for routing on the server
    payload: { type: 'string' }, // JSON stringified payload
    timestamp: { type: 'string' },
    status: { type: 'string' } // PENDING, SYNCED, FAILED
  },
  required: ['id', 'type', 'entity', 'entityId', 'boardId', 'timestamp', 'status']
};

export const commentSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    taskId: { type: 'string', maxLength: 100 },
    text: { type: 'string' },
    author: { type: 'string' },
    createdAt: { type: 'string' },
    version: { type: 'number' },
    deviceId: { type: 'string' }
  },
  required: ['id', 'taskId', 'text', 'author', 'createdAt', 'version', 'deviceId']
};

export const activitySchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    taskId: { type: 'string', maxLength: 100 },
    type: { type: 'string' },
    description: { type: 'string' },
    timestamp: { type: 'string' }
  },
  required: ['id', 'taskId', 'type', 'description', 'timestamp']
};
