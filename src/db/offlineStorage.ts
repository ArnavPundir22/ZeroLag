export interface OfflineFile {
  id: string; // The local attachment UUID
  file: Blob; // The binary file data
  mimeType: string;
  name: string;
}

const DB_NAME = 'zerolag_offline_storage';
const STORE_NAME = 'files';
const DELETE_STORE_NAME = 'pending_deletes';

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DELETE_STORE_NAME)) {
        db.createObjectStore(DELETE_STORE_NAME, { keyPath: 'path' });
      }
    };
  });
};

export const saveOfflineFile = async (id: string, file: Blob, name: string, mimeType: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ id, file, name, mimeType });
    
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Failed to save offline file:', request.error);
      reject(request.error);
    };
  });
};

export const getOfflineFile = async (id: string): Promise<OfflineFile | undefined> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('Failed to get offline file:', request.error);
      reject(request.error);
    };
  });
};

export const deleteOfflineFile = async (id: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Failed to delete offline file:', request.error);
      reject(request.error);
    };
  });
};

export const queueCloudFileForDeletion = async (path: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DELETE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(DELETE_STORE_NAME);
    const request = store.put({ path, timestamp: Date.now() });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getPendingDeletes = async (): Promise<string[]> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DELETE_STORE_NAME, 'readonly');
    const store = tx.objectStore(DELETE_STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const result = request.result || [];
      resolve(result.map(item => item.path));
    };
    request.onerror = () => reject(request.error);
  });
};

export const removePendingDelete = async (path: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DELETE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(DELETE_STORE_NAME);
    const request = store.delete(path);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
