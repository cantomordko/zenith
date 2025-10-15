# 🔄 Supabase Realtime Setup

## Co to jest Realtime?

Supabase Realtime pozwala nasłuchiwać zmian w bazie danych w czasie rzeczywistym. Gdy ktoś doda, edytuje lub usunie ticket - wszyscy użytkownicy zobaczą zmianę od razu bez odświeżania strony!

---

## Krok 1: Włącz Realtime dla tabel w Supabase Dashboard

**⚠️ WAŻNE:** Realtime NIE jest włączony domyślnie! Musisz zaznaczyć checkbox dla każdej tabeli.

### Instrukcja krok po kroku:

1. **Otwórz Supabase Dashboard**
   - Wejdź na: https://supabase.com
   - Zaloguj się i wybierz swój projekt

2. **Przejdź do Database → Tables**
   - W lewym menu kliknij **Database**
   - Następnie **Tables**

3. **Włącz Realtime dla każdej tabeli:**

   **Dla tabeli `tickets`:**
   - Znajdź tabelę **tickets** na liście
   - Kliknij w **3 kropki** (⋮) obok nazwy tabeli
   - Wybierz **"Edit table"** lub **"Update table"**
   - Znajdź checkbox **"Enable Realtime"**
   - ✅ **ZAZNACZ** ten checkbox
   - Kliknij **Save** / **Update table**

   **Powtórz dla pozostałych tabel:**
   - ✅ **comments** - włącz Realtime
   - ✅ **ticket_history** - włącz Realtime
   - ✅ **tags** - włącz Realtime
   - ✅ **ticket_tags** - włącz Realtime
   - ✅ **columns** - włącz Realtime (opcjonalnie)
   - ✅ **user_profiles** - włącz Realtime (opcjonalnie)

4. **Poczekaj ~10-20 sekund**
   - Supabase musi zaktualizować konfigurację
   - Nie odświeżaj strony za szybko

5. **Gotowe!**
   - Realtime jest teraz aktywny dla wszystkich tabel
   - Możesz przejść do Kroku 2

**💡 Tip:** Checkbox "Enable Realtime" opisany jest jako "Broadcast changes on this table to authorized subscribers"

**⚠️ Uwaga:** Jeśli widzisz komunikat o "Replication" jako Early Access - **zignoruj go!** Nie potrzebujemy Replication. Wystarczy checkbox "Enable Realtime".

---

## Krok 2: Przetestuj Realtime

Realtime powinien działać od razu! Sprawdźmy:

1. Otwórz aplikację: `http://localhost:3000`
2. Zaloguj się
3. Otwórz DevTools (F12) → **Console**
4. Powinieneś zobaczyć:
   ```
   Realtime subscription: SUBSCRIBED
   ```
5. Jeśli widzisz "SUBSCRIBED" - **działa!** ✅

---

## Jak to działa?

### Architektura:
```
User A zmienia ticket
    ↓
Supabase PostgreSQL (UPDATE)
    ↓
Realtime Broadcasting
    ↓
WebSocket connection
    ↓
User B otrzymuje UPDATE event
    ↓
Board automatycznie się aktualizuje
```

### Typy zdarzeń:
- `INSERT` - nowy ticket dodany
- `UPDATE` - ticket edytowany
- `DELETE` - ticket usunięty

---

## Co będzie działać na żywo:

✅ **Dodawanie ticketów** - natychmiastowe pojawienie się na boardzie  
✅ **Edycja ticketów** - zmiana tytułu, opisu, priorytetu  
✅ **Usuwanie ticketów** - natychmiastowe zniknięcie  
✅ **Drag & drop** - przesunięcia między kolumnami  
✅ **Komentarze** - nowe komentarze pojawiają się od razu  
✅ **Multi-user** - widzisz zmiany innych użytkowników w czasie rzeczywistym

---

## Troubleshooting

### Problem: "Realtime subscription failed"
**Rozwiązanie:** Sprawdź klucze API w .env.local - muszą być poprawne (NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY)

### Problem: "WebSocket connection failed"
**Rozwiązanie:** Sprawdź klucze API w .env.local - muszą być poprawne

### Problem: "Changes not appearing"
**Rozwiązanie:** 
1. Poczekaj ~30 sekund po włączeniu Realtime
2. Odśwież stronę (Ctrl+R)
3. Sprawdź Console (F12) czy są błędy

### Problem: "Too many connections"
**Rozwiązanie:** Supabase Free tier ma limit connectionów. Upewnij się że unsubscribe() jest wywoływane w cleanup.

---

## Performance

### Optymalizacje które już są w kodzie:
- ✅ Debounce dla drag & drop (500ms) - nie bombarduje Realtime
- ✅ useCallback dla funkcji subscription
- ✅ Proper cleanup w useEffect
- ✅ Filter events tylko dla tej samej tabeli

### Best Practices:
- Subscribe tylko do potrzebnych tabel
- Unsubscribe when component unmounts
- Nie rób mutation w subscription callback (tylko read)

---

## 🎓 Zaawansowane (na później)

### Presence - kto jest online:
```typescript
const channel = supabase.channel('online-users')
  .on('presence', { event: 'sync' }, () => {
    const users = channel.presenceState()
    console.log('Online users:', users)
  })
```

### Broadcast - custom events:
```typescript
channel.send({
  type: 'broadcast',
  event: 'cursor-move',
  payload: { x: 100, y: 200 }
})
```

---

## Status Check

Po wykonaniu Kroku 1 i Kroku 2, powiedz mi:
- ✅ Włączyłem Realtime dla tabel
- 🔍 Widzę "SUBSCRIBED" w konsoli
- 🎉 Gotowe do testowania!

---

## 🧪 Jak przetestować Realtime

### Test 1: Dwa okna przeglądarki

1. **Otwórz dwa okna** Chrome/Edge obok siebie
2. W obu otwórz: `http://localhost:3000`
3. Zaloguj się w obu (możesz użyć tego samego konta)
4. **Test dodawania:**
   - W oknie 1: Dodaj nowy ticket
   - Okno 2: Ticket pojawi się automatycznie! 🎉
5. **Test edycji:**
   - W oknie 1: Edytuj tytuł ticketu
   - Okno 2: Zmiana pojawi się automatycznie!
6. **Test drag & drop:**
   - W oknie 1: Przesuń ticket do innej kolumny
   - Okno 2: Ticket przesunie się automatycznie!
7. **Test komentarzy:**
   - W oknie 1: Otwórz ticket i dodaj komentarz
   - Okno 2: Komentarz pojawi się w real-time!

### Test 2: Sprawdź Console

Otwórz DevTools (F12) → Console

Powinieneś zobaczyć:
```
Realtime subscription: SUBSCRIBED
```

Po każdej zmianie zobaczysz:
```
Realtime change: { eventType: 'INSERT', new: {...}, old: null }
```

### Test 3: Toast Notifications

Po każdej zmianie w drugim oknie powinny pojawić się toasty:
- ✅ "Nowy ticket dodany!"
- 🔄 "Ticket zaktualizowany"
- ❌ "Ticket usunięty"
- 💬 "Nowy komentarz!"

---

## ✅ Co powinno działać:

- [x] Dodawanie ticketów - natychmiastowa aktualizacja
- [x] Edycja ticketów - natychmiastowa aktualizacja
- [x] Usuwanie ticketów - natychmiastowa aktualizacja
- [x] Drag & drop - natychmiastowa aktualizacja
- [x] Komentarze - natychmiastowa aktualizacja
- [x] Toast notifications - pokazują się przy zmianach
- [x] Multi-user - zmiany widoczne dla wszystkich

---

## 🎉 Gotowe!

Jeśli wszystko działa - **Punkt 4: Real-time Updates jest UKOŃCZONY!** 🚀
