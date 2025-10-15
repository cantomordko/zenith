# 🎯 Git Setup - Jak zapisać projekt

## Jeśli nie masz Git:

### Windows - Pobierz Git:
1. Idź do https://git-scm.com/download/win
2. Pobierz i zainstaluj Git for Windows
3. Podczas instalacji zaznacz "Git Bash Here" i "Add to PATH"
4. Uruchom ponownie terminal/VS Code

### Sprawdź czy działa:
```bash
git --version
```

---

## Kiedy masz już Git:

### Krok 1: Inicjalizacja repozytorium

```bash
git init
```

### Krok 2: Dodaj wszystkie pliki

```bash
git add .
```

### Krok 3: Pierwszy commit

```bash
git commit -m "🎉 Initial commit: Zenith Kanban z autentykacją

Funkcjonalności:
- ✅ Next.js 15 + TypeScript + Tailwind CSS
- ✅ Supabase PostgreSQL + Authentication
- ✅ Kanban board z drag & drop
- ✅ CRUD ticketów
- ✅ Komentarze i historia zmian
- ✅ Tagi/labels
- ✅ Dashboard z statystykami
- ✅ Zaawansowane filtrowanie (search, sort, dates)
- ✅ System użytkowników (login, rejestracja, role)
- ✅ Protected routes
- ✅ Auto-assign ticketów
- ✅ Dark mode
- ✅ Responsywny design"
```

### Krok 4 (opcjonalnie): Połącz z GitHub

Jeśli chcesz wrzucić na GitHub:

1. Stwórz nowe repozytorium na https://github.com/new
2. NIE zaznaczaj "Add README" (mamy już)
3. Skopiuj komendy które GitHub pokaże, np:

```bash
git remote add origin https://github.com/TWOJ_USERNAME/jira3.git
git branch -M main
git push -u origin main
```

---

## ⚠️ WAŻNE - Nigdy nie commituj:

- `.env.local` - zawiera klucze API (już jest w .gitignore)
- `node_modules/` - zależności (już jest w .gitignore)
- `.next/` - pliki tymczasowe (już jest w .gitignore)

Plik `.gitignore` już to zabezpiecza! ✅

---

## 📝 Przyszłe commity:

Po każdej większej zmianie:

```bash
git add .
git commit -m "Opis zmian"
git push  # jeśli masz GitHub
```

Przykłady dobrych commitów:
```bash
git commit -m "✨ Dodaj real-time updates z Supabase"
git commit -m "🐛 Napraw bug z duplikującymi się ticketami"
git commit -m "🎨 Popraw responsywność na mobile"
git commit -m "📝 Zaktualizuj dokumentację"
```

---

## 🎓 Przydatne komendy Git:

```bash
git status              # Zobacz co się zmieniło
git log                 # Historia commitów
git diff                # Zobacz zmiany w plikach
git checkout -- plik    # Cofnij zmiany w pliku
git reset HEAD~1        # Cofnij ostatni commit (zachowaj zmiany)
```

---

## 🌟 Stan aktualny projektu:

**Data:** 9 października 2025  
**Wersja:** 1.0.0  
**Status:** Punkt 3 ukończony - system użytkowników działa! 🎉

**Co działa:**
- Pełny Kanban board z drag & drop
- Autentykacja Supabase (login/rejestracja)
- Protected routes
- Auto-assign ticketów do zalogowanego użytkownika
- Dashboard z metrykami
- Zaawansowane filtrowanie z debounce
- Komentarze, historia, tagi
- Dark mode, responsywność

**Następne:**
- Punkt 4: Real-time updates
- Punkt 5: Załączniki
- Punkt 6: Subtasks
