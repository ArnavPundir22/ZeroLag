-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, subscription)
);

-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage (insert, update, delete) their own subscriptions
CREATE POLICY "Users can manage their own subscriptions" ON push_subscriptions
  FOR ALL
  USING (user_id = (select auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));

-- Allow users to read subscriptions of collaborators they share a board with
CREATE POLICY "Users can view subscriptions of collaborators" ON push_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_access ba1
      JOIN board_access ba2 ON ba1.board_id = ba2.board_id
      WHERE ba1.user_id = push_subscriptions.user_id
      AND ba2.user_id = (select auth.jwt() ->> 'sub')
    )
  );

-- Optimize board_access SELECT policy to prevent infinite recursion
-- and allow collaborators to view each other
DROP POLICY IF EXISTS "Allow select for board members" ON board_access;
DROP POLICY IF EXISTS "Users can view board_access" ON board_access;
DROP POLICY IF EXISTS "Users can view board members" ON board_access;

CREATE POLICY "Allow public select for board_access mapping" ON board_access
  FOR SELECT
  USING (true);
