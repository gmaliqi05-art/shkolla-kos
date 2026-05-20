-- Paketa 41: Lexim publik për tabelat e referencës (vazhdim)
-- subjects, academic_years, subject_grades janë struktura referencë
-- që duhen të lexohen edhe nga demo/anon për të mbushur dropdowns
-- e formularëve (psh "Krijo Shkollë", "Vendos Nota").

DROP POLICY IF EXISTS "Public read subjects" ON subjects;
CREATE POLICY "Public read subjects" ON subjects
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read academic_years" ON academic_years;
CREATE POLICY "Public read academic_years" ON academic_years
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read subject_grades" ON subject_grades;
CREATE POLICY "Public read subject_grades" ON subject_grades
  FOR SELECT TO anon, authenticated USING (true);
