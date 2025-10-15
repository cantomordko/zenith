# 🗄️ Konfiguracja Supabase

## Krok 1: Utwórz projekt w Supabase

1. Idź do https://supabase.com
2. Zaloguj się lub załóż konto
3. Kliknij "New Project"
4. Wybierz organizację i podaj nazwę projektu (np. "zenith-kanban")
5. Ustaw hasło do bazy danych (zapisz je!)
6. Wybierz region (najbliższy Tobie, np. Frankfurt)
7. Kliknij "Create new project"

## Krok 2: Wykonaj SQL Schema

1. W panelu Supabase przejdź do **SQL Editor** (ikona w lewym menu)
2. Kliknij **+ New Query**
3. Skopiuj całą zawartość pliku `supabase-schema.sql`
4. Wklej do edytora SQL
5. Kliknij **Run** (lub Ctrl+Enter)

To utworzy:
- Tabelę `tickets` dla ticketów
- Tabelę `columns` dla kolumn
- Tabelę `comments` dla komentarzy do ticketów
- Początkowe 4 kolumny
- Indeksy dla wydajności
- Row Level Security (RLS) z publicznym dostępem
- Automatyczne triggery do aktualizacji dat

## Krok 3: Pobierz klucze API

1. W panelu Supabase przejdź do **Settings** → **API**
2. Znajdź sekcję **Project URL** i **API Keys**
3. Skopiuj:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon public** key (długi string)

## Krok 4: Skonfiguruj zmienne środowiskowe

1. W głównym folderze projektu utwórz plik `.env.local`
2. Dodaj te zmienne:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=twój-anon-key-tutaj
```

3. Zapisz plik

## Krok 5: Restart serwera

1. Zatrzymaj serwer dev (Ctrl+C w terminalu)
2. Uruchom ponownie: `npm run dev`

## ✅ Gotowe!

Aplikacja automatycznie wykryje konfigurację Supabase i zacznie używać prawdziwej bazy danych.

### Sprawdzenie

1. Otwórz http://localhost:3000
2. Dodaj nowy ticket
3. Przejdź do Supabase → **Table Editor** → **tickets**
4. Powinieneś zobaczyć swój ticket!

---

## 🔒 Bezpieczeństwo (na później)

Teraz każdy ma dostęp do danych. Aby dodać autentykację:

1. W Supabase włącz **Authentication**
2. Zmień polityki RLS w `supabase-schema.sql`
3. Dodaj logowanie do aplikacji

---

## 📊 Opcjonalne: Dodaj przykładowe dane

Jeśli chcesz mieć dane demonstracyjne od razu w bazie:

```sql
-- Wstaw przykładowe tickety
INSERT INTO tickets (title, description, priority, column_id, assignee, position) VALUES
  ('Problem z logowaniem', 'Użytkownik nie może się zalogować do systemu', 'high', 'column-1', 'Jan Kowalski', 0),
  ('Aktualizacja oprogramowania', 'Wymagana aktualizacja do najnowszej wersji', 'medium', 'column-1', 'Anna Nowak', 1),
  ('Serwer nie odpowiada', 'Serwer produkcyjny nie odpowiada na zapytania', 'critical', 'column-2', 'Piotr Wiśniewski', 0),
  ('Błąd w raporcie', 'Raport wyświetla nieprawidłowe dane', 'low', 'column-4', NULL, 0);
```

Uruchom to w SQL Editor w Supabase.
