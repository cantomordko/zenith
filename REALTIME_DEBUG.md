# Debug: Realtime nie działa

## Problem
Realtime subscription w Supabase nie wykrywa zmian w bazie danych. Zmiany pojawiają się dopiero po odświeżeniu strony.

## Sprawdź w Supabase Dashboard

### Krok 1: Sprawdź czy Realtime jest włączony dla tabel

**DOKŁADNA INSTRUKCJA:**

1. Otwórz: https://supabase.com
2. Zaloguj się i wybierz swój projekt
3. W lewym menu: **Database** → **Tables**
4. Znajdź tabelę **tickets** na liście
5. Kliknij **3 kropki (⋮)** obok nazwy tabeli
6. Wybierz **"Edit table"** lub **"Update table"**
7. Znajdź checkbox **"Enable Realtime"**
   - Opis: "Broadcast changes on this table to authorized subscribers"
8. ✅ **ZAZNACZ** ten checkbox (jeśli nie jest zaznaczony)
9. Kliknij **Save** / **Update table**
10. Poczekaj ~10-20 sekund

**Powtórz dla wszystkich tabel:**
- ✅ `tickets`
- ✅ `comments`
- ✅ `ticket_history`
- ✅ `tags`
- ✅ `ticket_tags`

### Krok 2: Sprawdź czy zmiany zadziałały

1. Odśwież aplikację (F5)
2. Otwórz Console (F12)
3. Powinieneś zobaczyć: `✅ Realtime subscription: SUBSCRIBED`

---

## Alternatywne rozwiązanie: Polling

Jeśli Realtime nadal nie działa, możemy użyć prostego pollingu (auto-refresh co kilka sekund).

###Zalety:
- ✅ Działa zawsze, bez konfiguracji
- ✅ Nie wymaga Supabase Realtime
- ✅ Prosty w implementacji

### Wady:
- ❌ Większe obciążenie serwera
- ❌ Opóźnienie do 2-3 sekund
- ❌ Niepotrzebne requesty gdy nikt nie dodaje ticketów

---

## Testowanie

### Test 1: Sprawdź logi w konsoli przeglądarki

1. Otwórz aplikację: http://localhost:3000
2. Naciśnij **F12** → zakładka **Console**
3. Poszukaj komunikatu: 
   ```
   ✅ Realtime subscription: SUBSCRIBED
   ```

**Jeśli NIE widzisz tego komunikatu:**
- Realtime NIE jest włączony w Supabase
- Lub jest problem z konfiguracją

**Jeśli widzisz "SUBSCRIBED" ale zmiany nie pojawiają się:**
- Problem z RLS policies
- Lub Supabase Realtime wymaga restartu projektu

### Test 2: Sprawdź Network tab

1. F12 → **Network** tab
2. Dodaj nowy ticket
3. Poszukaj request: `POST /api/tickets` - powinien zwrócić **201**
4. Jeśli tak - ticket jest w bazie, ale realtime go nie wykrył

---

## Szybkie rozwiązanie: Włącz polling

Zmodyfikuj plik `src/components/KanbanBoard.tsx`:

Znajdź linię:
```typescript
// Realtime subscription - nasłuchuj zmian w bazie
useEffect(() => {
```

Dodaj PRZED nią:
```typescript
// Auto-refresh co 2 sekundy
useEffect(() => {
  if (isLoading) return;
  
  const interval = setInterval(() => {
    fetchBoard();
  }, 2000); // 2 sekundy
  
  return () => clearInterval(interval);
}, [isLoading]);
```

To sprawi że board będzie się odświeżać automatycznie co 2 sekundy.

---

## Pytanie do Ciebie

Czy w konsoli przeglądarki (F12) widzisz komunikat:
```
✅ Realtime subscription: SUBSCRIBED
```

**Jeśli TAK** - realtime jest aktywny ale nie wykrywa zmian  
**Jeśli NIE** - realtime w ogóle się nie łączy

Odpowiedz i pomogę dalej!
