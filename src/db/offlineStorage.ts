import Dexie, { type Table } from 'dexie';

export interface OfflineFile {
  id: string; // The local attachment UUID
  file: Blob; // The binary file data
  mimeType: string;
  name: string;
}

export class OfflineStorageDB extends Dexie {
  files!: Table<OfflineFile>;

  constructor() {
    super('zerolag_offline_storage');
    this.version(1).stores({
      files: 'id' // Primary key
    });
  }
}

export const offlineDb = new OfflineStorageDB();

export const saveOfflineFile = async (id: string, file: Blob, name: string, mimeType: string) => {
  await offlineDb.files.put({ id, file, name, mimeType });
};

export const getOfflineFile = async (id: string): Promise<OfflineFile | undefined> => {
  return await offlineDb.files.get(id);
};

export const deleteOfflineFile = async (id: string) => {
  await offlineDb.files.delete(id);
};
