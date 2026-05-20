/*
  # Paketa 14: Biblioteka Shkollore

  Tabelat:
  1. library_books — katalog librash me ISBN, autor, kategori
  2. book_loans — gjurmim i huazimeve nga nxënësit/mësuesit
*/

CREATE TABLE IF NOT EXISTS library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn text,
  title text NOT NULL,
  author text DEFAULT '',
  publisher text DEFAULT '',
  publication_year integer,
  category text NOT NULL DEFAULT 'tjeter' CHECK (category IN ('letersi','shkence','matematike','histori','gjeografi','gjuhe','art','biografi','enciklopedi','tekst_shkollor','tjeter')),
  language text DEFAULT 'sq',
  copies_total integer NOT NULL DEFAULT 1 CHECK (copies_total > 0),
  copies_available integer NOT NULL DEFAULT 1 CHECK (copies_available >= 0),
  location text DEFAULT '',
  cover_url text,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  CHECK (copies_available <= copies_total)
);

CREATE INDEX IF NOT EXISTS library_books_title_idx ON library_books(title);
CREATE INDEX IF NOT EXISTS library_books_category_idx ON library_books(category);
CREATE INDEX IF NOT EXISTS library_books_isbn_idx ON library_books(isbn) WHERE isbn IS NOT NULL;

ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated read books" ON library_books;
CREATE POLICY "All authenticated read books"
  ON library_books FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Director manages books" ON library_books;
CREATE POLICY "Director manages books"
  ON library_books FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

CREATE TABLE IF NOT EXISTS book_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES library_books(id) ON DELETE RESTRICT,
  borrower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loan_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  returned_date date,
  status text NOT NULL DEFAULT 'aktive' CHECK (status IN ('aktive','kthyer','vonuar','humbur')),
  notes text DEFAULT '',
  issued_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS book_loans_borrower_idx ON book_loans(borrower_id);
CREATE INDEX IF NOT EXISTS book_loans_book_idx ON book_loans(book_id);
CREATE INDEX IF NOT EXISTS book_loans_status_idx ON book_loans(status);

ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages loans" ON book_loans;
CREATE POLICY "Director manages loans"
  ON book_loans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "Borrowers read own loans" ON book_loans;
CREATE POLICY "Borrowers read own loans"
  ON book_loans FOR SELECT TO authenticated
  USING (borrower_id = auth.uid());

DROP POLICY IF EXISTS "Parents read child loans" ON book_loans;
CREATE POLICY "Parents read child loans"
  ON book_loans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students WHERE parent_students.student_id = book_loans.borrower_id AND parent_students.parent_id = auth.uid()));

-- Trigger për të ulur/rritur automatikisht copies_available
CREATE OR REPLACE FUNCTION update_book_copies()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'aktive' THEN
    UPDATE library_books SET copies_available = copies_available - 1 WHERE id = NEW.book_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'aktive' AND NEW.status IN ('kthyer','humbur') THEN
      UPDATE library_books SET copies_available = copies_available + 1 WHERE id = NEW.book_id;
    ELSIF OLD.status IN ('kthyer','humbur') AND NEW.status = 'aktive' THEN
      UPDATE library_books SET copies_available = copies_available - 1 WHERE id = NEW.book_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'aktive' THEN
    UPDATE library_books SET copies_available = copies_available + 1 WHERE id = OLD.book_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_book_copies ON book_loans;
CREATE TRIGGER trg_update_book_copies
  AFTER INSERT OR UPDATE OR DELETE ON book_loans
  FOR EACH ROW EXECUTE FUNCTION update_book_copies();
