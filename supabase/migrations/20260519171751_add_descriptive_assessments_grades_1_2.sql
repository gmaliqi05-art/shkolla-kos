/*
  # Add descriptive assessment system for grades 1-2

  Per UA 06/2022 MASHTI, klasat 1-2 perdorin vleresim pershkrues (jo numerik).
  Kjo tabele ruan vleresuimet pershkruese me 5 nivele.

  1. New Tables
    - `descriptive_assessments`
      - `id` (uuid, primary key)
      - `student_id` (uuid, FK to profiles)
      - `class_id` (uuid, FK to classes)
      - `subject_id` (uuid, FK to subjects)
      - `teacher_id` (uuid, FK to profiles)
      - `level` (integer, 1-5: 1=pamjaftueshem, 5=shkelqyer)
      - `comment` (text, narrative feedback)
      - `period` (integer, 1-3: three teaching periods)
      - `date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Directors read all
    - Teachers read/insert/update their own
    - Students read own
    - Parents read children's
*/

CREATE TABLE IF NOT EXISTS descriptive_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id),
  class_id uuid NOT NULL REFERENCES classes(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  teacher_id uuid NOT NULL REFERENCES profiles(id),
  level integer NOT NULL CHECK (level >= 1 AND level <= 5),
  comment text DEFAULT '',
  period integer NOT NULL DEFAULT 1 CHECK (period >= 1 AND period <= 3),
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id, subject_id, period)
);

ALTER TABLE descriptive_assessments ENABLE ROW LEVEL SECURITY;

-- Directors read all
CREATE POLICY "Directors read all descriptive assessments"
  ON descriptive_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'
    )
  );

-- Teachers read their own
CREATE POLICY "Teachers read own descriptive assessments"
  ON descriptive_assessments FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Teachers insert
CREATE POLICY "Teachers insert descriptive assessments"
  ON descriptive_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'mesues'
    )
  );

-- Teachers update own
CREATE POLICY "Teachers update own descriptive assessments"
  ON descriptive_assessments FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Teachers delete own
CREATE POLICY "Teachers delete own descriptive assessments"
  ON descriptive_assessments FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Students read own
CREATE POLICY "Students read own descriptive assessments"
  ON descriptive_assessments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Parents read children
CREATE POLICY "Parents read children descriptive assessments"
  ON descriptive_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.parent_id = auth.uid()
      AND parent_students.student_id = descriptive_assessments.student_id
    )
  );
