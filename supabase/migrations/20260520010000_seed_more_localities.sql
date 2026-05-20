/*
  # Paketa 21: Plotësim i fshatrave për 28 komunat e mbetura

  Komunat e mëdha (Prishtinë, Prizren, Pejë, Mitrovicë, Gjakovë, Ferizaj,
  Gjilan, Vushtrri, Podujevë, Suharekë) janë seeded që në Paketën 19.
  Tani po plotësohen 28 komunat e tjera me 3-5 fshatra për secilën.
*/

DO $$
DECLARE
  m_id uuid;
BEGIN
  -- Rahovec
  SELECT id INTO m_id FROM municipalities WHERE name = 'Rahovec';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Krushë e Madhe', m_id, 'fshat', false),
      ('Drenoc', m_id, 'fshat', false),
      ('Hoçë e Vogël', m_id, 'fshat', false),
      ('Xërxë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Lipjan
  SELECT id INTO m_id FROM municipalities WHERE name = 'Lipjan';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Magurë', m_id, 'fshat', false),
      ('Janjevë', m_id, 'fshat', false),
      ('Krajkovë', m_id, 'fshat', false),
      ('Sllatinë', m_id, 'fshat', false),
      ('Bujë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Skenderaj
  SELECT id INTO m_id FROM municipalities WHERE name = 'Skenderaj';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Prekaz', m_id, 'fshat', false),
      ('Llaushë', m_id, 'fshat', false),
      ('Polac', m_id, 'fshat', false),
      ('Mikushnicë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Malishevë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Malishevë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Banjë', m_id, 'fshat', false),
      ('Llapçevë', m_id, 'fshat', false),
      ('Carralluk', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Drenas
  SELECT id INTO m_id FROM municipalities WHERE name = 'Drenas';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Komoran', m_id, 'fshat', false),
      ('Vërbovc', m_id, 'fshat', false),
      ('Zabel i Ulët', m_id, 'fshat', false),
      ('Korroticë e Ulët', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Kamenicë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Kamenicë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Kololeq', m_id, 'fshat', false),
      ('Topanicë', m_id, 'fshat', false),
      ('Krilevë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Viti
  SELECT id INTO m_id FROM municipalities WHERE name = 'Viti';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Pozharan', m_id, 'fshat', false),
      ('Beguncë', m_id, 'fshat', false),
      ('Sadovinë e Çerkezëve', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Deçan
  SELECT id INTO m_id FROM municipalities WHERE name = 'Deçan';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Strellc i Epërm', m_id, 'fshat', false),
      ('Isniq', m_id, 'fshat', false),
      ('Lloçan', m_id, 'fshat', false),
      ('Pobërgjë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Istog
  SELECT id INTO m_id FROM municipalities WHERE name = 'Istog';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Banjë', m_id, 'fshat', false),
      ('Vrellë', m_id, 'fshat', false),
      ('Lubozhdë', m_id, 'fshat', false),
      ('Dragolevc', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Klinë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Klinë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Drenoc', m_id, 'fshat', false),
      ('Volljakë', m_id, 'fshat', false),
      ('Krushë e Vogël', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Kaçanik
  SELECT id INTO m_id FROM municipalities WHERE name = 'Kaçanik';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Gajre', m_id, 'fshat', false),
      ('Lipiq', m_id, 'fshat', false),
      ('Begracë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Shtime
  SELECT id INTO m_id FROM municipalities WHERE name = 'Shtime';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Petrovë', m_id, 'fshat', false),
      ('Mollopolc', m_id, 'fshat', false),
      ('Belincë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Fushë Kosovë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Fushë Kosovë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Miradi e Epërme', m_id, 'fshat', false),
      ('Pomozotin', m_id, 'fshat', false),
      ('Vragoli', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Obiliq
  SELECT id INTO m_id FROM municipalities WHERE name = 'Obiliq';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Plemetin', m_id, 'fshat', false),
      ('Babimoc', m_id, 'fshat', false),
      ('Sibovc i Poshtëm', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Dragash
  SELECT id INTO m_id FROM municipalities WHERE name = 'Dragash';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Brod', m_id, 'fshat', false),
      ('Restelicë', m_id, 'fshat', false),
      ('Globoçicë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Shtërpcë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Shtërpcë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Brezovicë', m_id, 'fshat', false),
      ('Vërbeshticë', m_id, 'fshat', false),
      ('Sevcë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Hani i Elezit
  SELECT id INTO m_id FROM municipalities WHERE name = 'Hani i Elezit';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Krivenik', m_id, 'fshat', false),
      ('Dërmjak', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Junik
  SELECT id INTO m_id FROM municipalities WHERE name = 'Junik';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Jasiq', m_id, 'fshat', false),
      ('Gjocaj', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Mamushë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Mamushë';
  IF m_id IS NOT NULL THEN
    -- Mamushë është komunë me një vendbanim
    NULL;
  END IF;

  -- Graçanicë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Graçanicë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Llapnasellë', m_id, 'fshat', false),
      ('Çagllavicë', m_id, 'fshat', false),
      ('Suvi Do', m_id, 'fshat', false),
      ('Preocë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Ranillug
  SELECT id INTO m_id FROM municipalities WHERE name = 'Ranillug';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Pasjak', m_id, 'fshat', false),
      ('Glanicë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Partesh
  SELECT id INTO m_id FROM municipalities WHERE name = 'Partesh';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Pasjan', m_id, 'fshat', false),
      ('Donja Budriga', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Kllokot
  SELECT id INTO m_id FROM municipalities WHERE name = 'Kllokot';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Vrbovac', m_id, 'fshat', false),
      ('Mogillë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Zveçan
  SELECT id INTO m_id FROM municipalities WHERE name = 'Zveçan';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Banjska', m_id, 'fshat', false),
      ('Boletin', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Zubin Potok
  SELECT id INTO m_id FROM municipalities WHERE name = 'Zubin Potok';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Jagnjenicë', m_id, 'fshat', false),
      ('Çabër', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Leposaviq
  SELECT id INTO m_id FROM municipalities WHERE name = 'Leposaviq';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Lešak', m_id, 'fshat', false),
      ('Sočanica', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Mitrovicë e Veriut
  SELECT id INTO m_id FROM municipalities WHERE name = 'Mitrovicë e Veriut';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Suvi Do', m_id, 'fshat', false),
      ('Žitkovac', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Novobërdë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Novobërdë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Bostan', m_id, 'fshat', false),
      ('Prekoc', m_id, 'fshat', false),
      ('Llabjan', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
