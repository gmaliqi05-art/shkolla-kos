/*
  # Add is_active column to schedule table

  ## Changes
  - Adds `is_active` boolean column to `schedule` table
    - Defaults to true so existing records remain visible
    - Allows teachers to toggle individual schedule entries on/off
    - Students will only see active schedule entries in their timetable

  ## Notes
  - No data loss — existing rows get is_active = true automatically
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedule' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE schedule ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;
