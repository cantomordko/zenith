-- Tworzenie tabeli dla tagów
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6', -- hex color
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela łącząca tickety z tagami (Many-to-Many)
CREATE TABLE IF NOT EXISTS ticket_tags (
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (ticket_id, tag_id)
);

-- Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket_id ON ticket_tags(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tags_tag_id ON ticket_tags(tag_id);

-- Row Level Security dla tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "Allow public read access to tags" ON tags;
DROP POLICY IF EXISTS "Allow public insert access to tags" ON tags;
DROP POLICY IF EXISTS "Allow public update access to tags" ON tags;
DROP POLICY IF EXISTS "Allow public delete access to tags" ON tags;

CREATE POLICY "Allow public read access to tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to tags"
  ON tags FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to tags"
  ON tags FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to tags"
  ON tags FOR DELETE
  USING (true);

-- Row Level Security dla ticket_tags
ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "Allow public read access to ticket_tags" ON ticket_tags;
DROP POLICY IF EXISTS "Allow public insert access to ticket_tags" ON ticket_tags;
DROP POLICY IF EXISTS "Allow public delete access to ticket_tags" ON ticket_tags;

CREATE POLICY "Allow public read access to ticket_tags"
  ON ticket_tags FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to ticket_tags"
  ON ticket_tags FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to ticket_tags"
  ON ticket_tags FOR DELETE
  USING (true);

-- Dodanie przykładowych tagów
INSERT INTO tags (name, color) VALUES
  ('bug', '#EF4444'),
  ('feature', '#3B82F6'),
  ('urgent', '#F59E0B'),
  ('enhancement', '#10B981'),
  ('documentation', '#8B5CF6'),
  ('question', '#EC4899')
ON CONFLICT (name) DO NOTHING;

-- Komentarze do tabel
COMMENT ON TABLE tags IS 'Tagi do kategoryzacji ticketów';
COMMENT ON TABLE ticket_tags IS 'Relacja many-to-many między ticketami a tagami';
