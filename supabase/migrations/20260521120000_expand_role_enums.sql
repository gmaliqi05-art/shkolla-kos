/*
  # Paketa 73: Zgjerimi i enum-eve të rolit

  PROBLEM: `profiles.role` ka CHECK constraint që pranon vetëm 4 nga 9 rolet
  e platformës. Signup për DKA, Ministri, Pedagog, Inspektor dhe SuperAdmin
  dështon në prodhim me "violates check constraint profiles_role_check".

  Po ashtu `announcements.target_role` mungon role-t e reja, kështu që
  Ministri/DKA nuk mund të dërgojnë njoftim te këto grupe.

  RREGULLIM: Hiq CHECK-un e vjetër dhe rikrijoj me listën e plotë të 9 roleve.
*/

-- profiles.role: 4 → 9 role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'drejtor',
    'mesues',
    'nxenes',
    'prind',
    'pedagog',
    'drejtor_komunal',
    'ministri',
    'inspektor',
    'super_admin'
  ));

-- announcements.target_role: 4 → 8 target audiences
-- (super_admin nuk merr njoftime sepse nuk është pjesë e komunitetit shkollor)
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_target_role_check;
ALTER TABLE announcements
  ADD CONSTRAINT announcements_target_role_check
  CHECK (target_role IN (
    'te_gjithe',
    'mesues',
    'nxenes',
    'prind',
    'pedagog',
    'drejtor',
    'drejtor_komunal',
    'inspektor'
  ));
