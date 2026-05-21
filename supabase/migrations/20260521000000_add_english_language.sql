/*
  # Paketa 72: Shtimi i gjuhës angleze (English)

  Zgjeron CHECK constraint te `profiles.preferred_language` për të
  përfshirë 'en' (English) si gjuhë të mbështetur, krahas sq/sr/tr/bs.

  Ligji 02/L-37: gjuhët zyrtare (sq, sr) + gjuhët komunale (tr, bs)
  Anglishtja shtohet si gjuhë opsionale për përdorues ndërkombëtarë.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_preferred_language_check
  CHECK (preferred_language IN ('sq', 'sr', 'tr', 'bs', 'en'));
