-- ========================================
-- 🔐 SUPABASE AUTHENTICATION SETUP
-- ========================================
-- Ten skrypt konfiguruje autentykację użytkowników w Supabase

-- 1. Rozszerzona tabela profili użytkowników (uzupełnia auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 3. Automatyczne tworzenie profilu przy rejestracji
-- Trigger, który automatycznie tworzy profil gdy użytkownik się zarejestruje
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usuń trigger jeśli już istnieje
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Utwórz trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Funkcja do aktualizacji updated_at
CREATE OR REPLACE FUNCTION public.update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger do automatycznej aktualizacji updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_profile_updated_at();

-- 5. Row Level Security (RLS) Policies

-- Włącz RLS dla user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki jeśli istnieją
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can change roles" ON public.user_profiles;

-- Policy: Każdy może zobaczyć wszystkie profile (do wyświetlania assignee)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.user_profiles
  FOR SELECT
  USING (true);

-- Policy: Użytkownicy mogą aktualizować tylko swój profil
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Tylko admini mogą zmieniać role
CREATE POLICY "Only admins can change roles"
  ON public.user_profiles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE role = 'admin'
    )
  );

-- 6. Zaktualizuj tabele tickets, żeby używały UUID użytkowników

-- Dodaj kolumnę assigned_to (UUID) jeśli nie istnieje
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN assigned_to UUID REFERENCES public.user_profiles(id);
    CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);
  END IF;
END $$;

-- Dodaj kolumnę created_by (UUID) - kto utworzył ticket
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN created_by UUID REFERENCES public.user_profiles(id);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets(created_by);
  END IF;
END $$;

-- 7. Zaktualizuj RLS policies dla tickets (opcjonalnie - później możesz dostosować)

-- Policy: Wszyscy zalogowani mogą przeglądać tickety
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON public.tickets;
CREATE POLICY "Authenticated users can view tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Zalogowani mogą tworzyć tickety
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.tickets;
CREATE POLICY "Authenticated users can create tickets"
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Użytkownicy mogą edytować swoje tickety lub tickety przypisane do nich
DROP POLICY IF EXISTS "Users can update own or assigned tickets" ON public.tickets;
CREATE POLICY "Users can update own or assigned tickets"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Admini i twórcy mogą usuwać tickety
DROP POLICY IF EXISTS "Admins and creators can delete tickets" ON public.tickets;
CREATE POLICY "Admins and creators can delete tickets"
  ON public.tickets
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 8. Podobne policies dla comments

DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.comments;
CREATE POLICY "Authenticated users can view comments"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Dodaj kolumnę user_id do comments jeśli nie istnieje
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN user_id UUID REFERENCES public.user_profiles(id);
    CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
  END IF;
END $$;

-- Email: demo@helpdesk.com


-- ========================================
-- ✅ GOTOWE!
-- ========================================
-- Teraz możesz:
-- 1. Włączyć Email Authentication w Supabase Dashboard (Authentication > Providers > Email)
-- 2. Opcjonalnie wyłączyć email confirmation: Authentication > Settings > "Enable email confirmations" = OFF (dla testów)
-- 3. Utworzyć demo użytkownika w Authentication > Users
-- 4. Zalogować się w aplikacji!

-- Sprawdzenie:
-- SELECT * FROM public.user_profiles;
-- SELECT * FROM auth.users;
