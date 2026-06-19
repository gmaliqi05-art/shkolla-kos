/*
  # Hiq lëndën "Fete dhe Kultura"

  Edukimi fetar NUK është pjesë e kurrikulës zyrtare të shkollave publike në
  Kosovë (vendim i Qeverisë, 2010). Lënda ishte seeduar gabimisht për klasat
  4–9 te 20260314155450_seed_kosovo_subjects_by_grade.sql.

  Verifikuar te baza live para heqjes: lënda referencohej VETËM te
  subject_grades (6 rreshta hartimi kurrikule) — asnjë notë, class_subject,
  vlerësim përshkrues apo orar. Pra heqja nuk humb asnjë të dhënë vlerësimi.

  Idempotent: nuk bën asgjë nëse lënda është hequr më parë; ruan lëndën nëse
  (në një mjedis tjetër) i janë bashkangjitur nota/orë realë.
*/

DELETE FROM subject_grades
WHERE subject_id IN (SELECT id FROM subjects WHERE name = 'Fete dhe Kultura');

DELETE FROM subjects s
WHERE s.name = 'Fete dhe Kultura'
  AND NOT EXISTS (SELECT 1 FROM class_subjects cs WHERE cs.subject_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM grades g WHERE g.subject_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM descriptive_assessments d WHERE d.subject_id = s.id)
  AND NOT EXISTS (SELECT 1 FROM schedule sc WHERE sc.subject_id = s.id);
