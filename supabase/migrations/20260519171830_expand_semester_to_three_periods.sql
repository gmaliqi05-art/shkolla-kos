/*
  # Expand grading periods from 2 semesters to 3 periods

  Per UA 06/2022 MASHTI, the school year is divided into 3 teaching periods (tremujore).
  This migration expands the existing semester column to support values 1, 2, 3.

  1. Changes
    - Alter CHECK constraint on grades.semester to allow values 1, 2, 3
    - Existing data (semester 1 or 2) remains valid
  
  2. Notes
    - No data loss - existing grades with semester 1 or 2 remain unchanged
    - Frontend will be updated to show 3 periods instead of 2
*/

-- Drop old constraint and add new one
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_semester_check;
ALTER TABLE grades ADD CONSTRAINT grades_semester_check CHECK (semester = ANY (ARRAY[1, 2, 3]));
