/*
  # Add messaging role validation via RLS

  Ensures that messages can only be sent according to the role hierarchy:
  - drejtor can message: mesues, nxenes, prind
  - mesues can message: nxenes, prind, drejtor
  - nxenes can only message: mesues
  - prind can only message: mesues

  This prevents bypassing the frontend ROLE_CAN_MESSAGE restrictions.
*/

-- Create a function to validate messaging permissions
CREATE OR REPLACE FUNCTION check_message_permission(sender uuid, receiver uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_role text;
  receiver_role text;
BEGIN
  SELECT role INTO sender_role FROM profiles WHERE id = sender;
  SELECT role INTO receiver_role FROM profiles WHERE id = receiver;
  
  IF sender_role IS NULL OR receiver_role IS NULL THEN
    RETURN false;
  END IF;

  CASE sender_role
    WHEN 'drejtor' THEN
      RETURN receiver_role IN ('mesues', 'nxenes', 'prind');
    WHEN 'mesues' THEN
      RETURN receiver_role IN ('nxenes', 'prind', 'drejtor');
    WHEN 'nxenes' THEN
      RETURN receiver_role = 'mesues';
    WHEN 'prind' THEN
      RETURN receiver_role = 'mesues';
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Drop existing insert policy and replace with role-validated one
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages' AND policyname = 'Sender can insert messages'
  ) THEN
    DROP POLICY "Sender can insert messages" ON messages;
  END IF;
END $$;

CREATE POLICY "Sender can insert messages with role check"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND check_message_permission(sender_id, receiver_id)
  );
