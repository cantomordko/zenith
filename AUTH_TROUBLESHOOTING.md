# 🔧 Testowanie Autentykacji Supabase

## Krok 1: Sprawdź czy Email Auth jest włączone

W Supabase Dashboard:
1. **Authentication** → **Providers**
2. Sprawdź czy **Email** ma zielony status (Enabled)
3. Jeśli nie - kliknij i włącz

## Krok 2: Wyłącz Email Confirmation (dla testów)

1. **Authentication** → **Settings**
2. Przewiń w dół do sekcji **"Email"**
3. Znajdź **"Enable email confirmations"**
4. **WYŁĄCZ** tę opcję (przełącznik na OFF)
5. Kliknij **Save**

⚠️ To jest WAŻNE - bez tego nie zalogujjesz się bez potwierdzenia emaila!

## Krok 3: Utwórz użytkownika RĘCZNIE w dashboardzie

Nie próbuj jeszcze rejestracji przez aplikację. Najpierw utwórzmy użytkownika ręcznie:

1. **Authentication** → **Users**
2. Kliknij **"Add user"** (zielony przycisk)
3. Wybierz **"Create new user"**
4. Wypełnij:
   ```
   Email: test@test.pl
   Password: test123
   ```
5. ✅ **ZAZNACZ** "Auto Confirm User" (bardzo ważne!)
6. Kliknij **"Create user"**

## Krok 4: Sprawdź czy profil został utworzony

1. W Supabase przejdź do **SQL Editor**
2. Wykonaj:

```sql
-- Sprawdź użytkowników w auth
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users;

-- Sprawdź profile
SELECT * FROM public.user_profiles;
```

Powinieneś zobaczyć:
- W `auth.users`: użytkownika z email_confirmed_at ustawionym
- W `user_profiles`: profil z tym samym email

❌ **Jeśli NIE MA profilu w user_profiles:**

```sql
-- Utwórz ręcznie profil dla istniejącego użytkownika
INSERT INTO public.user_profiles (id, email, name, role)
SELECT id, email, split_part(email, '@', 1), 'user'
FROM auth.users
WHERE email = 'test@test.pl'
ON CONFLICT (id) DO NOTHING;
```

## Krok 5: Testuj logowanie

1. Otwórz http://localhost:3000/login
2. Zaloguj się:
   ```
   Email: test@test.pl
   Password: test123
   ```
3. Otwórz DevTools (F12) → Console
4. Szukaj komunikatów błędów

## 📊 Oczekiwane rezultaty:

### ✅ Sukces:
- Toast: "Zalogowano pomyślnie!"
- Przekierowanie do strony głównej
- Navbar pokazuje twój profil

### ❌ Błąd 400 "Invalid login credentials":
Oznacza że:
- Użytkownik nie istnieje w `auth.users`
- Hasło jest złe
- Email nie jest potwierdzony

**Rozwiązanie:** Wróć do Kroku 3 i utwórz użytkownika ponownie, upewniając się że zaznaczyłeś "Auto Confirm User"

### ❌ Błąd "Email not confirmed":
Oznacza że:
- Email confirmation jest włączone

**Rozwiązanie:** Wróć do Kroku 2 i wyłącz email confirmations

## 🔍 Debug - sprawdź co zwraca Supabase:

W DevTools Console po próbie logowania zobaczysz:
```
Login error: { message: "Invalid login credentials", ... }
```

Komunikat mówi dokładnie co jest nie tak.

---

## ✅ Checklist przed testowaniem:

- [ ] Email Provider jest włączony w Authentication > Providers
- [ ] Email confirmations są WYŁĄCZONE w Authentication > Settings
- [ ] Użytkownik istnieje w auth.users (Authentication > Users)
- [ ] Auto Confirm User było zaznaczone przy tworzeniu
- [ ] Profil istnieje w public.user_profiles (sprawdź przez SQL)
- [ ] Trigger handle_new_user() istnieje (wykonałeś supabase-auth-setup.sql)

---

## 🆘 Jeśli nadal nie działa:

Wykonaj pełny reset:

```sql
-- 1. Usuń wszystkie profile
DELETE FROM public.user_profiles;

-- 2. Usuń wszystkich użytkowników (w Authentication > Users kliknij "Delete user")

-- 3. Sprawdź czy trigger istnieje
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 4. Jeśli nie ma triggera, wykonaj ponownie supabase-auth-setup.sql

-- 5. Utwórz nowego użytkownika przez dashboard z Auto Confirm User
```
