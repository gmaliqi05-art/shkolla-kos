/*
  # Add absence excuse request system

  Parents can submit excuse requests for their child's absences.
  Teachers review and approve/reject them.

  1. New Tables
    - `absence_excuses`
      - `id` (uuid, primary key)
      - `student_id` (uuid, FK to profiles)
      - `parent_id` (uuid, FK to profiles)
      - `date_from` (date, start of absence period)
      - `date_to` (date, end of absence period)
      - `reason` (text, explanation from parent)
      - `status` (text: pending/approved/rejected)
      - `reviewed_by` (uuid, nullable, FK to profiles - teacher/director who reviewed)
      - `reviewed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled
    - Parents insert own, read own
    - Teachers read for their students, update status
    - Directors read all, update status
*/

CREATE TABLE IF NOT EXISTS absence_excuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id),
  parent_id uuid NOT NULL REFERENCES profiles(id),
  date_from date NOT NULL,
  date_to date NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE absence_excuses ENABLE ROW LEVEL SECURITY;

-- Parents read own requests
CREATE POLICY "Parents read own excuse requests"
  ON absence_excuses FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

-- Parents insert own requests
CREATE POLICY "Parents insert excuse requests"
  ON absence_excuses FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.parent_id = auth.uid()
      AND parent_students.student_id = absence_excuses.student_id
    )
  );

-- Teachers read excuses for students in their classes
CREATE POLICY "Teachers read student excuse requests"
  ON absence_excuses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'mesues'
    )
    AND EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN class_subjects cs ON cs.class_id = sc.class_id
      WHERE sc.student_id = absence_excuses.student_id
      AND cs.teacher_id = auth.uid()
    )
  );

-- Teachers update status
CREATE POLICY "Teachers update excuse status"
  ON absence_excuses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'mesues'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'mesues'
    )
  );

-- Directors read all
CREATE POLICY "Directors read all excuse requests"
  ON absence_excuses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'
    )
  );

-- Directors update status
CREATE POLICY "Directors update excuse status"
  ON absence_excuses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'
    )
  );
