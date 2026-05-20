-- Paketa 30: Seedim shkollash reale për Kosovë
-- 102 shkolla të mbjella për 38 komunat

DO $$
DECLARE
  m_id uuid;
  l_id uuid;
BEGIN
  -- PRISHTINË (5 shkolla)
  SELECT id INTO m_id FROM municipalities WHERE name = 'Prishtinë';
  IF m_id IS NOT NULL THEN
    SELECT id INTO l_id FROM localities WHERE name = 'Prishtinë' AND municipality_id = m_id;
    INSERT INTO school_info (name, full_name, municipality_id, locality_id, school_type, municipality) VALUES
      ('Naim Frashëri', 'SHFMU "Naim Frashëri"', m_id, l_id, 'fillore_mesme_ulet', 'Prishtinë'),
      ('Asdreni', 'SHFMU "Asdreni"', m_id, l_id, 'fillore_mesme_ulet', 'Prishtinë'),
      ('Ismail Qemali', 'SHFMU "Ismail Qemali"', m_id, l_id, 'fillore_mesme_ulet', 'Prishtinë'),
      ('Pjetër Bogdani', 'SHFMU "Pjetër Bogdani"', m_id, l_id, 'fillore_mesme_ulet', 'Prishtinë'),
      ('Hasan Prishtina', 'Gjimnazi "Hasan Prishtina"', m_id, l_id, 'mesme_larte', 'Prishtinë')
    ON CONFLICT DO NOTHING;
  END IF;

  -- (Komunat tjera... shih migration në Supabase për listën e plotë)
END $$;
