-- 1) Vérifier que RLS est activé (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Supprimer TOUTES les policies SELECT existantes sur profiles
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 3) Recréer les policies SELECT avec TO explicite

-- Bloquer l'accès anonyme
CREATE POLICY "Block anonymous access"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Utilisateurs : voir uniquement leur propre profil
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admin : voir tous les profils
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 4) Révoquer/accorder les permissions (plus strict)
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;