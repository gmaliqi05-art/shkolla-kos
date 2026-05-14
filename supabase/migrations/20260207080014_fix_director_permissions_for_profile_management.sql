/*
  # Fix Director Permissions for Profile Management

  1. Changes
    - Add policy for directors to INSERT new profiles (teachers, students, parents)
    - Add policy for directors to DELETE profiles
    - These are critical for the "Manage Teachers" and "Manage Students" functionality

  2. Security
    - Only directors can insert profiles for other users
    - Only directors can delete profiles
    - Maintains existing security for other roles
*/

-- Allow directors to insert profiles for new users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Directors can insert new profiles'
  ) THEN
    CREATE POLICY "Directors can insert new profiles"
      ON profiles FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor')
      );
  END IF;
END $$;

-- Allow directors to delete profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Directors can delete profiles'
  ) THEN
    CREATE POLICY "Directors can delete profiles"
      ON profiles FOR DELETE TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor')
      );
  END IF;
END $$;
