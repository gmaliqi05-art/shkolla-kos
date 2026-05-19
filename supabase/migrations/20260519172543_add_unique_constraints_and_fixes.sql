/*
  # Add Missing UNIQUE Constraints and Database Fixes

  1. Constraints Added
    - `attendance` table: UNIQUE on (student_id, class_id, date) to support upsert operations
    - `student_classes` table: UNIQUE on (student_id, class_id) to prevent duplicate enrollment
    - `parent_students` table: UNIQUE on (parent_id, student_id) to prevent duplicate links
    - `class_subjects` table: UNIQUE on (class_id, subject_id) to prevent duplicate subject assignments

  2. Security
    - Add RLS policy on messages to validate sender/receiver role combinations
    - Ensures messaging permissions are enforced at the database level

  3. Important Notes
    - These constraints prevent data duplication errors in the application
    - The attendance unique constraint enables proper upsert functionality
    - Message RLS policy mirrors the ROLE_CAN_MESSAGE frontend logic
*/

-- Add unique constraint for attendance (enables upsert in AttendancePage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'attendance' AND indexname = 'attendance_student_class_date_unique'
  ) THEN
    CREATE UNIQUE INDEX attendance_student_class_date_unique
    ON attendance(student_id, class_id, date);
  END IF;
END $$;

-- Add unique constraint for student_classes (one enrollment per student per class)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'student_classes' AND indexname = 'student_classes_student_class_unique'
  ) THEN
    CREATE UNIQUE INDEX student_classes_student_class_unique
    ON student_classes(student_id, class_id);
  END IF;
END $$;

-- Add unique constraint for parent_students (one link per parent-child pair)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'parent_students' AND indexname = 'parent_students_parent_student_unique'
  ) THEN
    CREATE UNIQUE INDEX parent_students_parent_student_unique
    ON parent_students(parent_id, student_id);
  END IF;
END $$;

-- Add unique constraint for class_subjects (one subject per class)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'class_subjects' AND indexname = 'class_subjects_class_subject_unique'
  ) THEN
    CREATE UNIQUE INDEX class_subjects_class_subject_unique
    ON class_subjects(class_id, subject_id);
  END IF;
END $$;

-- Add RLS policy on messages to enforce role-based messaging at database level
-- Director can message: mesues, nxenes, prind
-- Teacher can message: nxenes, prind, drejtor
-- Student can only message: mesues
-- Parent can only message: mesues
CREATE OR REPLACE FUNCTION check_message_role_permission(sender uuid, receiver uuid)
RETURNS boolean AS $$
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
    WHEN 'drejtor' THEN RETURN receiver_role IN ('mesues', 'nxenes', 'prind');
    WHEN 'mesues' THEN RETURN receiver_role IN ('nxenes', 'prind', 'drejtor');
    WHEN 'nxenes' THEN RETURN receiver_role = 'mesues';
    WHEN 'prind' THEN RETURN receiver_role = 'mesues';
    ELSE RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing insert policy if exists and create new one with role check
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages' AND policyname = 'Users can send messages with role check'
  ) THEN
    DROP POLICY "Users can send messages with role check" ON messages;
  END IF;
END $$;

-- Drop the old permissive insert policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'messages' AND policyname = 'Sender can insert messages'
  ) THEN
    DROP POLICY "Sender can insert messages" ON messages;
  END IF;
END $$;

CREATE POLICY "Users can send messages with role check"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND check_message_role_permission(sender_id, receiver_id)
  );
