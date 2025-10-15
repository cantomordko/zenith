# 🚀 Jira3 - Instrukcja instalacji (Plug & Play)

## 📋 Wymagania

Zanim zaczniesz, upewnij się że masz zainstalowane:
- ✅ **Node.js** (v18 lub nowszy) - https://nodejs.org
- ✅ **Git** - https://git-scm.com/downloads
- ✅ **Konto Supabase** (darmowe) - https://supabase.com

---

## 🔧 Krok 1: Sklonuj repozytorium

```bash
git clone https://github.com/Iz1nox/Jira3.git
cd Jira3
```

---

## 📦 Krok 2: Zainstaluj zależności

```bash
npm install
```

To potrwa ~2-3 minuty. Poczekaj aż się skończy.

---

## 🗄️ Krok 3: Stwórz projekt w Supabase

### 3.1. Załóż konto na Supabase
1. Wejdź na: https://supabase.com
2. Kliknij **"Start your project"**
3. Zaloguj się przez GitHub (lub email)

### 3.2. Utwórz nowy projekt
1. Kliknij **"New Project"**
2. Wybierz organizację (lub stwórz nową)
3. Wypełnij dane:
   - **Name**: `jira3` (lub dowolna nazwa)
   - **Database Password**: Wymyśl silne hasło (zapisz je!)
   - **Region**: Wybierz najbliższy (np. Europe - Frankfurt)
4. Kliknij **"Create new project"**
5. ⏳ Poczekaj ~2 minuty aż projekt się utworzy

### 3.3. Skopiuj klucze API
1. W dashboardzie Supabase, kliknij **Settings** (ikona zębatki) w lewym menu
2. Przejdź do **API**
3. Skopiuj:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon public** key (długi ciąg znaków)

---

## 🔐 Krok 4: Skonfiguruj zmienne środowiskowe

### 4.1. Stwórz plik `.env.local`

W głównym folderze projektu stwórz plik `.env.local`:

```bash
# Windows (PowerShell)
New-Item .env.local

# macOS/Linux
touch .env.local
```

### 4.2. Wklej konfigurację

Otwórz `.env.local` w edytorze i wklej (zastąp swoimi kluczami):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://TWÓJ_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TWÓJ_ANON_KEY
```

**⚠️ WAŻNE:** Zamień `TWÓJ_PROJECT_ID` i `TWÓJ_ANON_KEY` na klucze skopiowane w kroku 3.3!

---

## 🗃️ Krok 5: Skonfiguruj bazę danych w Supabase

### 5.1. Uruchom pliki SQL w poprawnej kolejności

⚠️ **WAŻNE:** Kolejność ma znaczenie! Zobacz: **[SQL_ORDER.md](SQL_ORDER.md)** dla szczegółów.

**Dla każdego pliku wykonaj:**

1. W Supabase Dashboard, przejdź do **SQL Editor** (lewa strona)
2. Kliknij **"New query"**
3. Otwórz odpowiedni plik `.sql` z projektu
4. **Skopiuj całą zawartość** pliku
5. **Wklej do SQL Editor** w Supabase
6. Kliknij **"Run"** (lub Ctrl+Enter)
7. ✅ Poczekaj na: "Success. No rows returned"

**Uruchom pliki w tej kolejności:**

#### 1️⃣ Schemat bazy danych
```
supabase-schema.sql
```
Tworzy wszystkie podstawowe tabele (columns, tickets, user_profiles, tags, ticket_tags)

#### 2️⃣ Autentykacja
```
supabase-auth-setup.sql
```
Konfiguruje RLS policies i uprawnienia użytkowników

#### 3️⃣ Historia zmian
```
supabase-history-migration.sql
```
Tworzy tabelę ticket_history

#### 4️⃣ Komentarze
```
supabase-comments-migration.sql
```
Tworzy tabelę comments

#### 5️⃣ Dane początkowe (opcjonalnie)
```
supabase-tags-migration.sql
```
Dodaje predefiniowane tagi (Bug, Feature, Enhancement, etc.)

### 5.4. Włącz Realtime (WAŻNE!)

**To jest kluczowe dla działania aplikacji w czasie rzeczywistym!**

Dla każdej z poniższych tabel:
1. Przejdź do **Database** → **Tables**
2. Znajdź tabelę na liście
3. Kliknij **3 kropki (⋮)** obok nazwy tabeli
4. Wybierz **"Edit table"**
5. Zaznacz checkbox: ✅ **"Enable Realtime"**
6. Kliknij **"Save"**

**Tabele do włączenia:**
- ✅ `tickets`
- ✅ `comments`
- ✅ `ticket_history`
- ✅ `tags`
- ✅ `ticket_tags`
- ✅ `columns`

Poczekaj ~20 sekund po włączeniu wszystkich.

---

## 🚀 Krok 6: Uruchom aplikację

```bash
npm run dev
```

Aplikacja będzie dostępna na: **http://localhost:3000**

---

## 👤 Krok 7: Zarejestruj się i zaloguj

1. Otwórz przeglądarkę: http://localhost:3000
2. Zobaczysz stronę logowania
3. Kliknij **"Zarejestruj się"** (na dole)
4. Wypełnij formularz:
   - Email
   - Hasło (min. 6 znaków)
5. Kliknij **"Zarejestruj się"**
6. ✅ Zostaniesz automatycznie zalogowany!

**Pierwsze konto automatycznie otrzymuje rolę ADMIN.**

---

## ✅ Sprawdź czy wszystko działa

### Test 1: Dodaj ticket
- Kliknij **"+ Dodaj ticket"** w kolumnie "To Do"
- Wypełnij tytuł i opis
- Kliknij **"Dodaj"**
- ✅ Ticket powinien pojawić się natychmiast

### Test 2: Drag & Drop
- Przeciągnij ticket do innej kolumny
- ✅ Powinien się przesunąć płynnie

### Test 3: Realtime (dwa okna)
- Otwórz drugie okno przeglądarki
- Dodaj ticket w pierwszym oknie
- ✅ Powinien pojawić się w drugim oknie automatycznie!

### Test 4: Console (F12)
- Naciśnij F12 → zakładka Console
- Powinieneś zobaczyć:
  ```
  ✅ Realtime subscription: SUBSCRIBED
  ```

---

## 🎨 Funkcje aplikacji

✅ **Kanban Board** - To Do, In Progress, Review, Done  
✅ **Dashboard** - Statystyki i wykresy  
✅ **Filtry** - Wyszukiwanie, priorytety, assignee, daty, tagi  
✅ **Drag & Drop** - Płynne przesuwanie ticketów  
✅ **Real-time** - Zmiany widoczne dla wszystkich od razu  
✅ **Komentarze** - Dodawaj komentarze do ticketów  
✅ **Historia** - Pełna historia zmian ticketu  
✅ **Tagi** - Kolorowe etykiety do kategoryzacji  
✅ **Autentykacja** - Login/Register z rolami (admin, user, viewer)  
✅ **Dark Mode** - Przełącznik w prawym górnym rogu  

---

## 🔧 Troubleshooting

### Problem: "Supabase not configured"
**Rozwiązanie:** Sprawdź plik `.env.local` - klucze muszą być poprawne

### Problem: "Failed to fetch"
**Rozwiązanie:** Upewnij się że:
1. Serwer jest uruchomiony (`npm run dev`)
2. Supabase projekt jest aktywny
3. SQL schema został uruchomiony

### Problem: "Realtime nie działa"
**Rozwiązanie:** 
1. Sprawdź czy włączyłeś "Enable Realtime" dla wszystkich tabel (Krok 5.4)
2. Odśwież stronę (F5)
3. Sprawdź Console (F12) czy są błędy

### Problem: "Cannot find module"
**Rozwiązanie:** Usuń `node_modules` i zainstaluj ponownie:
```bash
rm -rf node_modules
npm install
```

### Problem: Błędy kompilacji CSS
**Rozwiązanie:** To normalne warningi Tailwind CSS v4 - nie wpływają na działanie

---

## 📚 Dodatkowe informacje

### Pliki konfiguracyjne
- `supabase-schema.sql` - Struktura bazy danych
- `supabase-auth-setup.sql` - Konfiguracja autentykacji
- `supabase-tags-migration.sql` - Predefiniowane tagi
- `REALTIME_SETUP.md` - Szczegółowa instrukcja Realtime
- `AUTH_SETUP.md` - Szczegóły autentykacji
- `GIT_SETUP.md` - Instrukcje Git

### Struktura projektu
```
jira3/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Komponenty React
│   ├── lib/              # Supabase client i helpers
│   └── types/            # TypeScript typy
├── public/               # Pliki statyczne
└── *.sql                 # Skrypty SQL dla Supabase
```

---

## 🤝 Pomoc

Jeśli masz problemy:
1. Sprawdź **Console** (F12) czy są błędy
2. Zobacz logi terminala (`npm run dev`)
3. Przeczytaj pliki `*_SETUP.md` w projekcie
4. Sprawdź czy wszystkie kroki zostały wykonane

---

## 🎉 Gotowe!

Jeśli wszystko działa - gratulacje! Masz działający system Zenith! 🚀

**Miłego korzystania!** ✨
