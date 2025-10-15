# 🔐 Konfiguracja Autentykacji w Supabase

## Krok 1: Włącz Email Authentication

1. Otwórz swój projekt Supabase (https://supabase.com)
2. Przejdź do **Authentication** → **Providers**
3. Znajdź **Email** i upewnij się, że jest włączony (zielony)
4. Przejdź do **Authentication** → **Settings** (URL Configuration)
5. **DLA TESTÓW:** Wyłącz "Enable email confirmations" (możesz włączyć później na produkcji)
   - To pozwoli logować się od razu bez potwierdzania emaila

## Krok 2: Wykonaj migrację SQL

1. W panelu Supabase przejdź do **SQL Editor**
2. Kliknij **+ New Query**
3. Skopiuj całą zawartość pliku `supabase-auth-setup.sql`
4. Wklej do edytora SQL
5. Kliknij **Run** (lub Ctrl+Enter)

To utworzy:
- ✅ Tabelę `user_profiles` z rozszerzonymi danymi użytkowników
- ✅ Automatyczne tworzenie profilu przy rejestracji (trigger)
- ✅ Kolumny `assigned_to` i `created_by` w tabeli `tickets`
- ✅ Kolumnę `user_id` w tabeli `comments`
- ✅ Row Level Security policies (użytkownicy mogą edytować swoje tickety)
- ✅ Role: admin, user, viewer

## Krok 3: Utwórz demo użytkownika (opcjonalnie)

### Opcja A: Rejestracja przez aplikację
1. Otwórz http://localhost:3000/login
2. Kliknij **Rejestracja**
3. Wypełnij formularz:
   - Imię: Demo User
   - Email: demo@helpdesk.com
   - Hasło: demo123
4. Kliknij "Utwórz konto"
5. Zaloguj się!

### Opcja B: Ręczne utworzenie w dashboardzie
1. W Supabase przejdź do **Authentication** → **Users**
2. Kliknij **Add user** → **Create new user**
3. Wypełnij:
   - Email: demo@helpdesk.com
   - Password: demo123
   - Auto Confirm User: ✅ (zaznacz)
4. Kliknij **Create user**
5. Profil zostanie automatycznie utworzony przez trigger!

## Krok 4: (Opcjonalnie) Ustaw użytkownika jako admina

1. W Supabase przejdź do **SQL Editor**
2. Wykonaj:

```sql
-- Znajdź ID użytkownika
SELECT id, email, role FROM public.user_profiles;

-- Ustaw jako admina (zamień UUID na rzeczywiste ID)
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'demo@helpdesk.com';
```

## Krok 5: Sprawdź czy działa

1. Otwórz http://localhost:3000/login
2. Zaloguj się danymi:
   - Email: demo@helpdesk.com
   - Hasło: demo123
3. Powinieneś zobaczyć navbar z twoim profilem!
4. Kliknij na awatar → dropdown z email + rolą + wylogowanie

## ✅ Gotowe!

Teraz masz pełną autentykację:
- 🔐 Logowanie i rejestracja
- 👤 Profile użytkowników z rolami
- 🎫 Tickety powiązane z użytkownikami
- 💬 Komentarze powiązane z użytkownikami
- 🛡️ Row Level Security

---

## 📊 Sprawdzenie w bazie

```sql
-- Zobacz wszystkich użytkowników
SELECT * FROM public.user_profiles;

-- Zobacz tickety z przypisanymi użytkownikami
SELECT 
  t.title, 
  up.email as assigned_to_email,
  creator.email as created_by_email
FROM public.tickets t
LEFT JOIN public.user_profiles up ON t.assigned_to = up.id
LEFT JOIN public.user_profiles creator ON t.created_by = creator.id;
```

---

## 🎨 Co dalej?

Po skonfigurowaniu auth możesz:
1. ✅ **Dodać middleware** - przekierowanie niezalogowanych do /login
2. ✅ **Role-based permissions** - różne uprawnienia dla admin/user/viewer
3. ✅ **Auto-assign** - automatyczne przypisywanie ticketów do zalogowanego użytkownika
4. ✅ **Filtr "Moje zadania"** - pokazuj tylko tickety użytkownika
5. ✅ **Avatar upload** - możliwość uploadu zdjęcia profilowego

---

## 🔧 Troubleshooting

### Problem: "Email not confirmed"
**Rozwiązanie:** Wyłącz email confirmation w Settings lub potwierdź email przez link w mailu

### Problem: "Invalid login credentials"
**Rozwiązanie:** Upewnij się, że użytkownik jest utworzony i hasło się zgadza

### Problem: "User profile not found"
**Rozwiązanie:** Sprawdź czy trigger działa:
```sql
SELECT * FROM public.user_profiles WHERE email = 'twoj@email.com';
```
Jeśli nie ma profilu, utwórz ręcznie:
```sql
INSERT INTO public.user_profiles (id, email, name, role)
SELECT id, email, email, 'user'
FROM auth.users
WHERE email = 'twoj@email.com';
```

### Problem: "Row Level Security Policy violation"
**Rozwiązanie:** Sprawdź czy jesteś zalogowany. W trybie testowym możesz tymczasowo wyłączyć RLS:
```sql
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;
-- (ale pamiętaj by włączyć przed produkcją!)
```
