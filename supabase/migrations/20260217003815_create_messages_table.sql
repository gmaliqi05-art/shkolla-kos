/*
  # Create messages table for inter-role communication

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `subject` (text, message subject line)
      - `content` (text, message body)
      - `is_read` (boolean, default false, tracks read status)
      - `created_at` (timestamptz, auto-set)

  2. Security
    - Enable RLS on `messages` table
    - Sender can view their own sent messages
    - Receiver can view their own received messages
    - Authenticated users can insert messages (sender must be themselves)
    - Receiver can update read status on their messages
    - Sender can delete their own sent messages

  3. Indexes
    - Index on receiver_id for fast inbox queries
    - Index on sender_id for sent messages queries
    - Index on is_read for unread count queries

  4. Communication Rules (enforced at app level)
    - Director can message: teachers, students, parents
    - Teacher can message: students, parents
    - Student can message: teachers
    - Parent can message: teachers
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(receiver_id, is_read) WHERE is_read = false;

CREATE POLICY "Users can view received messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can view sent messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can send messages as themselves"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Senders can delete own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);
