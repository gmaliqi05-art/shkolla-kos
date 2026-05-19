/*
  # Paketa 9: Shumëgjuhësia (Ligji 02/L-37)

  Përputhshmëri me:
  - Ligji 02/L-37 për Përdorimin e Gjuhëve
  - Ligji 04/L-032, Neni 9 — e drejta për arsim në gjuhën amtare

  Gjuhët zyrtare të Kosovës: Shqip, Serbisht
  Gjuhë në komuna: Turqisht, Boshnjakisht, Romani
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'sq' CHECK (preferred_language IN ('sq', 'sr', 'tr', 'bs'));
