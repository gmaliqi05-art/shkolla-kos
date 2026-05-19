/*
  # Add Descriptive Assessment for Grades 1-2 and Update to 3 Periods

  Per UA 06/2022 MASHTI (Kosovo education regulation):
  - Grades 1-2 use descriptive assessment (5 levels, no numeric grades)
  - The school year is divided into 3 teaching periods (trimester), not 2 semesters

  1. New Tables
    - `descriptive_assessments` - stores descriptive evaluations for grade 1-2 students
      - `id` (uuid, primary key)
      - `student_id` (uuid, FK to profiles)
      - `subject_id` (uuid, FK to subjects)
      - `class_id` (uuid, FK to classes)
      - `teacher_id` (uuid, FK to profiles)
      - `period` (integer, 1-3)
      - `level` (text, one of 5 descriptive levels)
      - `comment` (text, optional narrative feedback)
      - `date` (date)
      - `created_at` (timestamptz)

  2. Modified Tables
    - `grades` table: expand semester check constraint to allow values 1, 2, or 3 (periods)

  3. Security
    - Enable RLS on `descriptive_assessments`
    - Policies mirror those of `grades` table (teacher writes, student/parent reads own)

  4. Notes
    - The 5 descriptive levels per Kosovo regulation are:
      - 'shkelqyeshem' (Excellent - outcomes fully met)
      - 'shume_kenaqshem' (Very satisfactory - outcomes met very well)
      - 'kenaqshem' (Satisfactory - outcomes met averagely)
      - 'mjaftueshem' (Minimum achievement)
      - 'pamjaftueshem' (Unsatisfactory - needs support)
    - Period 1, 2, 3 replaces the old Semester 1, 2 system
*/

-- Create descriptive_assessments table for grades 1-2
CREATE TABLE IF NOT EXISTS descriptive_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id),
  subject_id uuid NOT NULL REFERENCES subjects(id),
  class_id uuid NOT NULL REFERENCES classes(id),
  teacher_id uuid NOT NULL REFERENCES profiles(id),
  period integer NOT NULL DEFAULT 1,
  level text NOT NULL DEFAULT 'kenaqshem',
  comment text DEFAULT '',
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT descriptive_assessments_period_check CHECK (period >= 1 AND period <= 3),
  CONSTRAINT descriptive_assessments_level_check CHECK (
    level = ANY (ARRAY['shkelqyeshem', 'shume_kenaqshem', 'kenaqshem', 'mjaftueshem', 'pamjaftueshem'])
  ),
  CONSTRAINT descriptive_assessments_unique UNIQUE (student_id, subject_id, class_id, period)
);

-- Enable RLS
ALTER TABLE descriptive_assessments ENABLE ROW LEVEL SECURITY;

-- Director can read all
CREATE POLICY "Directors can read all descriptive assessments"
  ON descriptive_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'drejtor')
  );

-- Teachers can read/write their own class assessments
CREATE POLICY "Teachers can read own descriptive assessments"
  ON descriptive_assessments FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert descriptive assessments"
  ON descriptive_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM class_subjects cs
      WHERE cs.class_id = descriptive_assessments.class_id
      AND cs.subject_id = descriptive_assessments.subject_id
      AND cs.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update own descriptive assessments"
  ON descriptive_assessments FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own descriptive assessments"
  ON descriptive_assessments FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Students can read own
CREATE POLICY "Students can read own descriptive assessments"
  ON descriptive_assessments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Parents can read children's
CREATE POLICY "Parents can read children descriptive assessments"
  ON descriptive_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = auth.uid()
      AND ps.student_id = descriptive_assessments.student_id
    )
  );

-- Update grades table: expand semester constraint to allow 3 periods
-- First drop the old constraint, then add the new one
DO $$
BEGIN
  -- Drop old check constraint on semester column
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'grades_semester_check'
  ) THEN
    ALTER TABLE grades DROP CONSTRAINT grades_semester_check;
  END IF;
END $$;

ALTER TABLE grades ADD CONSTRAINT grades_semester_check CHECK (semester = ANY (ARRAY[1, 2, 3]));
