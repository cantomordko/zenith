-- Tworzenie tabeli dla historii zmian ticketów
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  changed_by TEXT NOT NULL,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'moved', 'deleted', 'status_changed'
  field_name TEXT, -- nazwa zmienionego pola (np. 'title', 'priority', 'assignee')
  old_value TEXT, -- stara wartość
  new_value TEXT, -- nowa wartość
  description TEXT, -- opis zmiany
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks dla szybkiego wyszukiwania historii po ticket_id
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);

-- Indeks dla sortowania po dacie
CREATE INDEX IF NOT EXISTS idx_ticket_history_created_at ON ticket_history(created_at DESC);

-- Row Level Security
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "Allow public read access to ticket_history" ON ticket_history;
DROP POLICY IF EXISTS "Allow public insert access to ticket_history" ON ticket_history;

-- Polityka dla odczytu (wszyscy mogą czytać)
CREATE POLICY "Allow public read access to ticket_history"
  ON ticket_history FOR SELECT
  USING (true);

-- Polityka dla wstawiania (wszyscy mogą dodawać)
CREATE POLICY "Allow public insert access to ticket_history"
  ON ticket_history FOR INSERT
  WITH CHECK (true);

-- Komentarz do tabeli
COMMENT ON TABLE ticket_history IS 'Historia wszystkich zmian w ticketach';
