-- Uruchom to w Supabase SQL Editor, jeśli już masz istniejące tabele
-- To doda tabelę comments do istniejącej bazy

-- Tabela dla komentarzy
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indeks dla szybkiego pobierania komentarzy ticketu
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Trigger dla automatycznej aktualizacji updated_at w komentarzach
-- Usuń istniejący trigger jeśli istnieje, potem stwórz nowy
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
