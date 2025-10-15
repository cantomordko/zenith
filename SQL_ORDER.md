# 📋 Kolejność uruchamiania SQL w Supabase

## ⚠️ WAŻNE: Uruchamiaj pliki SQL w tej dokładnej kolejności!

### Krok 1: Struktura bazy danych (GŁÓWNY PLIK)
```
1. supabase-schema.sql
```
**Co robi:** Tworzy wszystkie podstawowe tabele:
- `columns` - kolumny Kanban (To Do, In Progress, Review, Done)
- `tickets` - główna tabela ticketów
- `user_profiles` - profile użytkowników
- `tags` - tagi
- `ticket_tags` - relacja ticket-tag

**Dlaczego pierwsze:** To fundament - inne tabele zależą od tych struktur.

---

### Krok 2: Autentykacja i bezpieczeństwo
```
2. supabase-auth-setup.sql
```
**Co robi:** 
- Ustawia Row Level Security (RLS) policies
- Konfiguruje uprawnienia dla użytkowników
- Tworzy funkcje triggery dla user_profiles

**Dlaczego drugie:** Musi być po stworzeniu tabel, ale przed danymi.

---

### Krok 3: Historia zmian ticketów
```
3. supabase-history-migration.sql
```
**Co robi:**
- Tworzy tabelę `ticket_history`
- Ustawia indeksy dla wydajności
- Konfiguruje RLS policies

**Dlaczego trzecie:** Potrzebuje tabeli `tickets` (z kroku 1) - ma klucz obcy `ticket_id`.

---

### Krok 4: Komentarze
```
4. supabase-comments-migration.sql
```
**Co robi:**
- Tworzy tabelę `comments`
- Ustawia indeksy
- Konfiguruje RLS policies

**Dlaczego czwarte:** Również potrzebuje `tickets` - ma klucz obcy `ticket_id`.

---

### Krok 5: Dane początkowe - Tagi (OPCJONALNIE)
```
5. supabase-tags-migration.sql
```
**Co robi:**
- Dodaje predefiniowane tagi (Bug, Feature, Enhancement, etc.)
- Wypełnia tabelę `tags` przykładowymi danymi

**Dlaczego ostatnie:** To tylko dane, nie struktura. Może być pominięte.

---

## 🚀 Jak uruchomić w Supabase Dashboard

### Dla każdego pliku (po kolei!):

1. Otwórz **Supabase Dashboard** → **SQL Editor**
2. Kliknij **"New query"**
3. Otwórz odpowiedni plik `.sql` na swoim komputerze
4. **Skopiuj całą zawartość** pliku
5. **Wklej do SQL Editor**
6. Kliknij **"Run"** (lub Ctrl+Enter)
7. ✅ Poczekaj na: "Success. No rows returned"
8. ❌ Jeśli błąd - przeczytaj komunikat i popraw
9. Przejdź do następnego pliku

---

## 📝 Kompletna kolejność (kopiuj i wklej):

```bash
# 1. GŁÓWNY SCHEMAT
supabase-schema.sql
  ↓
# 2. AUTENTYKACJA I BEZPIECZEŃSTWO  
supabase-auth-setup.sql
  ↓
# 3. HISTORIA ZMIAN
supabase-history-migration.sql
  ↓
# 4. KOMENTARZE
supabase-comments-migration.sql
  ↓
# 5. DANE POCZĄTKOWE (opcjonalnie)
supabase-tags-migration.sql
```

---

## ⚠️ Częste błędy i rozwiązania

### Błąd: "relation tickets does not exist"
**Przyczyna:** Próbujesz uruchomić `supabase-history-migration.sql` lub `supabase-comments-migration.sql` PRZED `supabase-schema.sql`

**Rozwiązanie:** Uruchom `supabase-schema.sql` najpierw!

---

### Błąd: "column ticket_id does not exist"
**Przyczyna:** Tabela `tickets` nie ma kolumny `id` (nieprawidłowy schema)

**Rozwiązanie:** Sprawdź czy `supabase-schema.sql` się wykonał poprawnie.

---

### Błąd: "permission denied"
**Przyczyna:** RLS policies nie są skonfigurowane

**Rozwiązanie:** Upewnij się że `supabase-auth-setup.sql` został uruchomiony.

---

### Błąd: "duplicate key value violates unique constraint"
**Przyczyna:** Próbujesz uruchomić plik po raz drugi

**Rozwiązanie:** To normalne - możesz zignorować lub usunąć duplikaty ręcznie.

---

## 🧹 Reset bazy danych (jeśli coś poszło nie tak)

Jeśli chcesz zacząć od nowa:

1. W Supabase Dashboard → **Database** → **Tables**
2. Usuń wszystkie tabele (⚠️ OSTRZEŻENIE: usuwa wszystkie dane!)
3. Uruchom pliki SQL ponownie w poprawnej kolejności

**LUB** użyj tego SQL:

```sql
-- UWAGA: To usuwa WSZYSTKIE dane!
DROP TABLE IF EXISTS ticket_history CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS ticket_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS columns CASCADE;
```

Potem uruchom pliki SQL od nowa.

---

## ✅ Jak sprawdzić czy wszystko działa?

Po uruchomieniu wszystkich plików:

1. Przejdź do **Database** → **Tables**
2. Powinieneś zobaczyć:
   - ✅ `columns` (4 wiersze)
   - ✅ `tickets`
   - ✅ `user_profiles`
   - ✅ `tags` (jeśli uruchomiłeś migration)
   - ✅ `ticket_tags`
   - ✅ `ticket_history`
   - ✅ `comments`

3. Każda tabela powinna mieć:
   - ✅ Kolumny (sprawdź strukturę)
   - ✅ RLS enabled (ikona kłódki)
   - ✅ Policies (kliknij w tabelę → Policies)

---

## 🎯 Quick Checklist

- [ ] 1. `supabase-schema.sql` ✅
- [ ] 2. `supabase-auth-setup.sql` ✅
- [ ] 3. `supabase-history-migration.sql` ✅
- [ ] 4. `supabase-comments-migration.sql` ✅
- [ ] 5. `supabase-tags-migration.sql` ✅ (opcjonalnie)
- [ ] 6. Włącz Realtime dla każdej tabeli (Database → Tables → 3 kropki → Enable Realtime)
- [ ] 7. Uruchom aplikację: `npm run dev`
- [ ] 8. Zarejestruj pierwszego użytkownika (automatycznie Admin)

---

**Gotowe! Baza danych jest skonfigurowana!** 🎉
