-- Note: Pour désactiver la confirmation d'email:
-- 1. Allez dans le dashboard Supabase
-- 2. Authentication > Providers > Email
-- 3. Décochez "Confirm email"

-- Ajouter une politique RLS pour permettre l'insertion dans profiles
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users only"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Ajouter une politique RLS pour permettre la mise à jour de son propre profil
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
CREATE POLICY "Enable update for users based on id"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ajouter une politique RLS pour permettre la lecture de son propre profil
DROP POLICY IF EXISTS "Enable select for users based on id" ON public.profiles;
CREATE POLICY "Enable select for users based on id"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Créer une fonction trigger pour créer automatiquement un profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = TIMEZONE('utc'::text, NOW());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
