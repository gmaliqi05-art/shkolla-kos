/*
  # Perditesimi i role constraint per rolet administrative

  1. Ndryshime ne `profiles`
    - Hiqet constraint i vjeter qe lejonte vetem 4 role
    - Shtohet constraint i ri qe lejon edhe: pedagog, drejtor_komunal, ministri, inspektor

  2. Arsyeja
    - Sistemi ka nevojë për role administrative si Drejtor Komunal (DKA), 
      Inspektor Arsimi, dhe Ministër MAShTI
    - Pa kete ndryshim, krijimi i llogarive te reja me keto role do te deshtonte
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (
  role = ANY (ARRAY[
    'drejtor'::text, 
    'mesues'::text, 
    'nxenes'::text, 
    'prind'::text,
    'pedagog'::text, 
    'drejtor_komunal'::text, 
    'ministri'::text, 
    'inspektor'::text
  ])
);
