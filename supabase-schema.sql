-- Tabela dla ticketów
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee TEXT,
  column_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela dla kolumn
CREATE TABLE columns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- Wstaw początkowe kolumny
INSERT INTO columns (id, title, position) VALUES
  ('column-1', 'Do zrobienia', 0),
  ('column-2', 'W trakcie', 1),
  ('column-3', 'Do weryfikacji', 2),
  ('column-4', 'Zakończone', 3);

-- Indeksy dla lepszej wydajności
CREATE INDEX idx_tickets_column_id ON tickets(column_id);
CREATE INDEX idx_tickets_position ON tickets(position);

-- Funkcja do automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger dla automatycznej aktualizacji updated_at
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Włącz Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

-- Polityki RLS - na razie wszyscy mogą wszystko (później można to ograniczyć)
-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "Enable read access for all users" ON tickets;
DROP POLICY IF EXISTS "Enable insert access for all users" ON tickets;
DROP POLICY IF EXISTS "Enable update access for all users" ON tickets;
DROP POLICY IF EXISTS "Enable delete access for all users" ON tickets;

CREATE POLICY "Enable read access for all users" ON tickets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON tickets FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON tickets FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON columns;
DROP POLICY IF EXISTS "Enable insert access for all users" ON columns;
DROP POLICY IF EXISTS "Enable update access for all users" ON columns;
DROP POLICY IF EXISTS "Enable delete access for all users" ON columns;

CREATE POLICY "Enable read access for all users" ON columns FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON columns FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON columns FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON columns FOR DELETE USING (true);

-- Tabela dla komentarzy
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indeks dla szybkiego pobierania komentarzy ticketu
CREATE INDEX idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Trigger dla automatycznej aktualizacji updated_at w komentarzach
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Włącz Row Level Security dla komentarzy
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla komentarzy
-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "Enable read access for all users" ON comments;
DROP POLICY IF EXISTS "Enable insert access for all users" ON comments;
DROP POLICY IF EXISTS "Enable update access for all users" ON comments;
DROP POLICY IF EXISTS "Enable delete access for all users" ON comments;

CREATE POLICY "Enable read access for all users" ON comments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON comments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON comments FOR DELETE USING (true);
