import { useEffect, useRef } from 'react';
import { useDatabase } from '../db/DatabaseProvider';
import { useSyncContext } from './useSyncEngine';
import { getOfflineFile, deleteOfflineFile, getPendingDeletes, removePendingDelete } from '../db/offlineStorage';

export const useAttachmentUploader = () => {
  const db = useDatabase();
  const { supabaseClient, isOffline } = useSyncContext();
  const isUploading = useRef(false);

  useEffect(() => {
    if (!db || isOffline || !supabaseClient || isUploading.current) return;

    const uploadPendingFiles = async () => {
      isUploading.current = true;
      try {
        // Process Pending Deletions first
        const pendingDeletes = await getPendingDeletes();
        for (const path of pendingDeletes) {
          const { error } = await supabaseClient.storage.from('task-attachments').remove([path]);
          if (!error || error.message.includes('not found')) {
            await removePendingDelete(path);
          }
        }

        const tasks = await db.tasks.find().exec();
        
        for (const task of tasks) {
          if (!task.attachments) continue;
          
          let hasChanges = false;
          const updatedAttachments = [];

          for (const att of task.attachments) {
            if (att.data?.startsWith('LOCAL:')) {
              const localId = att.data.replace('LOCAL:', '');
              const localFile = await getOfflineFile(localId);
              
              if (localFile) {
                const fileExt = localFile.name.split('.').pop() || '';
                const fileName = `${localId}.${fileExt}`;
                const filePath = `${task.id}/${fileName}`;
                
                const { error: uploadError } = await supabaseClient.storage
                  .from('task-attachments')
                  .upload(filePath, localFile.file);
                  
                if (uploadError) {
                  console.error('Failed to background upload:', uploadError);
                  updatedAttachments.push(att); // Keep it local for next time
                } else {
                  const { data } = supabaseClient.storage
                    .from('task-attachments')
                    .getPublicUrl(filePath);
                    
                  updatedAttachments.push({
                    ...att,
                    data: data.publicUrl
                  });
                  hasChanges = true;
                  
                  // Cleanup local
                  await deleteOfflineFile(localId);
                }
              } else {
                updatedAttachments.push(att);
              }
            } else {
              updatedAttachments.push(att);
            }
          }
          
          if (hasChanges) {
            await task.patch({
              attachments: updatedAttachments,
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Background upload error:', err);
      } finally {
        isUploading.current = false;
      }
    };

    uploadPendingFiles();
    const interval = setInterval(uploadPendingFiles, 30000);
    return () => clearInterval(interval);
  }, [db, isOffline, supabaseClient]);
};
