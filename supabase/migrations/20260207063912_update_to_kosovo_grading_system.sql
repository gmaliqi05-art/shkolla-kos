/*
  # Update to Kosovo Grading System

  1. Changes
    - Update grade scale from 4-10 (Albanian) to 1-5 (Kosovo standard)
    - 1 = Pamjaftueshme (Insufficient) 
    - 2 = Mjaftueshme (Sufficient)
    - 3 = Mire (Good)
    - 4 = Shume Mire (Very Good)
    - 5 = Shkelqyeshem (Excellent)

  2. Updates
    - Alter CHECK constraint on grades table for grade column
    - Grade types updated to Kosovo terminology

  3. Notes
    - Kosovo uses 1-5 grading scale for basic education (grades 1-9)
    - This follows MASHT (Ministry of Education) regulations
*/

ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_grade_check;
ALTER TABLE grades ADD CONSTRAINT grades_grade_check CHECK (grade BETWEEN 1 AND 5);

ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_grade_type_check;
ALTER TABLE grades ADD CONSTRAINT grades_grade_type_check 
  CHECK (grade_type IN ('detyre', 'test', 'provim', 'projekt', 'gojore', 'praktike'));