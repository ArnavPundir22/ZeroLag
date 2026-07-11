-- Create the bucket for task attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Allow anyone to view/read attachments
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'task-attachments' );

-- Policy 2: Allow authenticated users to upload attachments
-- We use auth.role() = 'authenticated' to ensure only signed-in users can upload
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( 
  bucket_id = 'task-attachments' 
  AND auth.role() = 'authenticated' 
);

-- Policy 3: Allow authenticated users to update their attachments
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'task-attachments' 
  AND auth.role() = 'authenticated' 
);

-- Policy 4: Allow authenticated users to delete attachments
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-attachments' 
  AND auth.role() = 'authenticated' 
);
