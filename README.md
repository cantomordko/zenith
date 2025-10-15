# 🎯 Jira3 - Zenith Kanban Board

> Profesjonalna aplikacja do zarządzania zgłoszeniami — Zenith Kanban Board z widokiem Kanban, real-time updates i pełną autentykacją użytkowników.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Quick Start

**Chcesz szybko uruchomić projekt?** Zobacz: **[INSTALLATION.md](INSTALLATION.md)** 📖

```bash
# 1. Sklonuj repo
git clone https://github.com/Iz1nox/Jira3.git
cd Jira3

# 2. Zainstaluj zależności
npm install

# 3. Skonfiguruj .env.local (zobacz INSTALLATION.md)
#    Szybko: skopiuj plik środowiskowy
#    cp .env.example .env.local
# 4. Uruchom SQL w Supabase (supabase-schema.sql)
# 5. Włącz Realtime w tabelach

# 6. Uruchom!
npm run dev
```

Aplikacja dostępna: **http://localhost:3000** 🎉

---

## 🛠️ Stack technologiczny

- **Next.js 15.5.4** - React framework z App Router i Turbopack
- **TypeScript** - Pełne typowanie
- **Tailwind CSS v4** - Modern styling
- **Supabase** - PostgreSQL database + Authentication + Realtime
- **@hello-pangea/dnd** - Drag and drop
- **react-hot-toast** - Notifications

---

## 📦 Pełna instrukcja instalacji

➡️ **[INSTALLATION.md](INSTALLATION.md)** - Krok po kroku, plug & play

## 📋 Funkcjonalności

### ✅ Zarządzanie ticketami
- Widok Kanban z kolumnami (Do zrobienia, W trakcie, Do weryfikacji, Zakończone)
- Przeciąganie ticketów między kolumnami (drag & drop)
- Dodawanie nowych ticketów przez formularz
- **Szczegółowy widok ticketu** - kliknięcie otwiera pełne szczegóły
  - Pełny tytuł i opis
  - ID ticketu
  - Duży badge priorytetu z ikoną
  - Przypisana osoba z avatarem
  - Data utworzenia i modyfikacji
  - **Sekcja komentarzy** - pełna funkcjonalność
- **Komentarze do ticketów**
  - Dodawanie komentarzy z autorem
  - Lista wszystkich komentarzy
  - Usuwanie komentarzy
  - Formatowanie czasu względnego (np. "5 min temu")
  - Avatary dla autorów
  - Zapis w bazie danych Supabase
- **Edycja ticketów** - modal z pełnym formularzem
- **Usuwanie ticketów** - z potwierdzeniem
- System priorytetów (niski, średni, wysoki, krytyczny)
- Przypisywanie osób do ticketów
- Kolorowanie ticketów według priorytetu

### 🔍 Filtrowanie i wyszukiwanie
- **Wyszukiwarka** - szukaj po tytule i opisie z debounce
- **Filtr priorytetu** - wybierz konkretny poziom
- **Filtr assignee** - znajdź tickety osoby
- **Sortowanie** - 7 opcji (data, priorytet, tytuł, assignee)
- **Filtr dat** - zakres od-do
- **Aktywne chipy** - usuń pojedyncze filtry
- **Licznik wyników** - ile ticketów znaleziono
- Resetowanie wszystkich filtrów jednym kliknięciem

### 🔐 Autentykacja i użytkownicy
- **Logowanie/Rejestracja** - formularz z validacją
- **Profile użytkowników** - email, nazwa, rola, avatar
- **System ról** - Admin, User, Viewer
- **Navbar z profilem** - dropdown menu z wylogowaniem
- **Row Level Security** - polityki bezpieczeństwa w bazie
- **Auto-assign** - przypisywanie ticketów do zalogowanego
- **Demo account** - demo@helpdesk.com / demo123

### 📊 Dashboard i statystyki
- **4 metryki** - łącznie, przypisane, nieprzypisane, krytyczne
- **Wykresy** - tickety według statusu i priorytetu
- **Top 5 assignees** - najaktywniejsze osoby
- **Ostatnie tickety** - 5 najnowszych z datami
- **Przełącznik widoku** - Dashboard ⟷ Kanban Board

### 🔔 Notyfikacje
- Toast notifications dla wszystkich akcji
- Potwierdzenia sukcesu/błędu

### 🎨 UX/UI
- Responsywny design
- Przyciski akcji pojawiają się po najechaniu na ticket
- Animacje drag & drop
- Animowane modala (fade in + slide up)
- Kliknięcie w kartę otwiera szczegóły
- Tytuł zmienia kolor po hover
- Ładny gradient w tle
- Emoji ikony dla lepszej wizualizacji

### 🔧 Backend
- REST API (Next.js API Routes)
- Integracja z Supabase (PostgreSQL)
- Automatyczny fallback do pamięci bez Supabase
- CRUD dla wszystkich operacji

## 📁 Struktura projektu

```
src/
├── app/
│   └── page.tsx          # Strona główna
├── components/
│   ├── KanbanBoard.tsx   # Główny komponent tablicy Kanban
│   ├── KanbanColumn.tsx  # Kolumna Kanban
│   └── TicketCard.tsx    # Karta pojedynczego ticketu
├── data/
│   └── initialData.ts    # Początkowe dane demonstracyjne
└── types/
    └── index.ts          # Definicje typów TypeScript
```

## 🔌 API Endpoints

- `GET /api/tickets` - Pobierz wszystkie dane
- `POST /api/tickets` - Utwórz nowy ticket
- `PUT /api/tickets` - Aktualizuj board (po drag & drop)
- `GET /api/tickets/[id]` - Pobierz konkretny ticket
- `PATCH /api/tickets/[id]` - Edytuj ticket
- `DELETE /api/tickets/[id]` - Usuń ticket

## 🎯 Dalszy rozwój

Zrobione:
- ✅ Dodawanie nowych ticketów
- ✅ Backend z API
- ✅ Integracja z Supabase
- ✅ Edycja istniejących ticketów
- ✅ Usuwanie ticketów
- ✅ Filtrowanie i wyszukiwanie
- ✅ Toast notifications
- ✅ Szczegółowy widok ticketu
- ✅ Komentarze do ticketów
- ✅ **Dashboard z statystykami** - metryki, wykresy, top assignees
- ✅ **Zaawansowane filtrowanie** - sortowanie, daty, aktywne chipy
- ✅ **Responsywność** - mobile/tablet/desktop
- ✅ **Autentykacja użytkowników** - logowanie, rejestracja, profile
- ✅ **System ról** - Admin, User, Viewer z różnymi uprawnieniami

### 🔄 Real-time Updates (✅ UKOŃCZONE)
- **Live synchronizacja** - zmiany widoczne dla wszystkich użytkowników natychmiast
- **Multi-window support** - działa w wielu oknach jednocześnie
- **WebSocket connections** - Supabase Realtime z postgres_changes
- **Auto-refresh** - board, komentarze, historia, tagi
- **Toast notifications** - powiadomienia o zmianach
- Zobacz: `REALTIME_SETUP.md`

### 🏷️ Tagi (✅ UKOŃCZONE)
- **Kolorowe etykiety** - kategoryzacja ticketów
- **Filtrowanie po tagach** - znajdź tickety z konkretnym tagiem
- **Zarządzanie tagami** - dodawanie/usuwanie tagów do ticketów
- **Predefiniowane tagi** - Bug, Feature, Enhancement, Documentation, Question

### 📜 Historia zmian (✅ UKOŃCZONE)
- **Audit log** - pełna historia wszystkich zmian ticketu
- **Timeline** - kto, kiedy i co zmienił
- **Real-time updates** - historia aktualizuje się na żywo

### 🌗 Dark Mode (✅ UKOŃCZONE)
- **Przełącznik** - w prawym górnym rogu navbar
- **Persistent** - zapamiętuje wybór w localStorage
- **System preference** - domyślnie używa preferencji systemowych

---

## 🔜 Roadmap (kolejne funkcje)

- 📎 **Punkt 5: Attachments** - Upload plików do ticketów
- 📋 **Punkt 6: Subtasks** - Podzadania z progress trackerem
- 🔔 **Punkt 7: Notifications** - System powiadomień email/push
- 📊 **Eksport** - CSV/PDF/Excel
- 🔍 **Zaawansowane filtry** - Custom queries, saved filters
- 👥 **Zarządzanie zespołem** - Team members, assignments
- 📈 **Analytics** - Wykresy, metryki, raporty

---

## 📚 Dokumentacja

- 📖 **[INSTALLATION.md](INSTALLATION.md)** - Kompletna instrukcja instalacji
- 🔄 **[REALTIME_SETUP.md](REALTIME_SETUP.md)** - Konfiguracja real-time updates
- 🔐 **[AUTH_SETUP.md](AUTH_SETUP.md)** - Autentykacja i role użytkowników
- 🗄️ **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Konfiguracja bazy danych
- 🐛 **[REALTIME_DEBUG.md](REALTIME_DEBUG.md)** - Troubleshooting realtime
- 📝 **[GIT_SETUP.md](GIT_SETUP.md)** - Workflow z Git

---

## 🤝 Dla współpracowników

Chcesz uruchomić projekt lokalnie? Wszystko co potrzebujesz jest w **[INSTALLATION.md](INSTALLATION.md)**.

Wystarczy:
1. Sklonować repo
2. Zainstalować npm packages
3. Stworzyć projekt Supabase
4. Uruchomić SQL schema
5. Włączyć Realtime w tabelach
6. `npm run dev`

**Plug & Play!** 🚀

---

## 📄 Licencja

MIT License - użyj jak chcesz! 🎉

---

## ⭐ Jeśli ci się podoba - daj gwiazdkę!

Pomaga to innym znaleźć projekt 😊
