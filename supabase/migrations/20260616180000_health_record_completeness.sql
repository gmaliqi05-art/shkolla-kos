/*
  # Plotësim i të dhënave shëndetësore të nxënësit

  Gjetur nga auditi: kërkohen të paktën 2 kontakte emergjente, plus
  alergji/grup gjaku/vaksinim. Tabela student_health_records kishte vetëm
  një kontakt dhe pa fushë alergjish.

  Shton kolona te student_health_records (RLS-ja ekzistuese mbetet:
  vetëm drejtori/pedagogu i shkollës, prindi & nxënësi).
*/

ALTER TABLE student_health_records ADD COLUMN IF NOT EXISTS blood_type text DEFAULT '';
ALTER TABLE student_health_records ADD COLUMN IF NOT EXISTS allergies text DEFAULT '';
ALTER TABLE student_health_records ADD COLUMN IF NOT EXISTS vaccination_notes text DEFAULT '';
ALTER TABLE student_health_records ADD COLUMN IF NOT EXISTS emergency_contact_2_name text DEFAULT '';
ALTER TABLE student_health_records ADD COLUMN IF NOT EXISTS emergency_contact_2_phone text DEFAULT '';
ALTER TABLE student_health_records ADD COLUMN IF NOT EXISTS emergency_contact_2_relation text DEFAULT '';
