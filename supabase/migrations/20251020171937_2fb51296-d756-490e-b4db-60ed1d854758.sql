-- Add user_id to chat_messages table
ALTER TABLE chat_messages ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations on chat_messages" ON chat_messages;

-- Policy: Users can view their own messages
CREATE POLICY "Users can view their own chat messages"
ON chat_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own messages  
CREATE POLICY "Users can insert their own chat messages"
ON chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can insert messages (for AI responses)
CREATE POLICY "Service role can insert AI chat messages"
ON chat_messages
FOR INSERT
TO service_role
WITH CHECK (true);