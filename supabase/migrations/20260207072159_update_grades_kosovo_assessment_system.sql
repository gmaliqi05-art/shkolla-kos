/*
  # Sistemi i Vlerësimit të Kosovës - Gjysmëvjetorët

  ## Ndryshimet

  1. **Modifikimi i tabelës grades**
     - Shtimi i `assessment_type` - Lloji i vlerësimit:
       * 'vlersim' - Vlerësimet 1-4 gjatë gjysmëvjetorit
       * 'perfundimtare_gjysmvjetor' - Nota përfundimtare e gjysmëvjetorit
       * 'perfundimtare_vjetor' - Nota përfundimtare vjetore
     - Shtimi i `assessment_number` - Numri i vlerësimit (1, 2, 3, 4) ose NULL për nota përfundimtare
     - Heqja e kolonës `grade_type` (detyre, test, etj.) sepse nuk nevojitet në sistemin e ri

  2. **Struktura e re**
     - **Gjysmëvjetori 1**: 4 vlerësime (assessment_number 1-4, semester 1) + nota përfundimtare
     - **Gjysmëvjetori 2**: 4 vlerësime (assessment_number 1-4, semester 2) + nota përfundimtare
     - **Viti shkollor**: Nota përfundimtare vjetore (assessment_type = 'perfundimtare_vjetor')

  3. **Siguria**
     - RLS policies mbeten të njëjta
*/

-- Hiqni kolonën e vjetër grade_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'grades' AND column_name = 'grade_type'
  ) THEN
    ALTER TABLE grades DROP COLUMN grade_type;
  END IF;
END $$;

-- Shtoni kolonat e reja për sistemin e vlerësimit
DO $$
BEGIN
  -- Shtoni assessment_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'grades' AND column_name = 'assessment_type'
  ) THEN
    ALTER TABLE grades ADD COLUMN assessment_type text NOT NULL DEFAULT 'vlersim' 
      CHECK (assessment_type IN ('vlersim', 'perfundimtare_gjysmvjetor', 'perfundimtare_vjetor'));
  END IF;

  -- Shtoni assessment_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'grades' AND column_name = 'assessment_number'
  ) THEN
    ALTER TABLE grades ADD COLUMN assessment_number integer 
      CHECK (assessment_number IS NULL OR assessment_number BETWEEN 1 AND 4);
  END IF;
END $$;

-- Shtoni një constraint për të siguruar që assessment_number është i përcaktuar për 'vlersim'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'grades_assessment_number_check'
  ) THEN
    ALTER TABLE grades ADD CONSTRAINT grades_assessment_number_check
      CHECK (
        (assessment_type = 'vlersim' AND assessment_number IS NOT NULL)
        OR (assessment_type IN ('perfundimtare_gjysmvjetor', 'perfundimtare_vjetor') AND assessment_number IS NULL)
      );
  END IF;
END $$;

-- Përditësoni indekset për performancë më të mirë
CREATE INDEX IF NOT EXISTS idx_grades_semester_assessment ON grades(semester, assessment_type, assessment_number);
CREATE INDEX IF NOT EXISTS idx_grades_student_semester ON grades(student_id, semester);
