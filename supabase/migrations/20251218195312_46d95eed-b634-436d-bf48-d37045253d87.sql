-- Remove email column from profiles table (security fix)
-- The email is already available via auth.users, no need to duplicate it

-- Drop index if exists
DROP INDEX IF EXISTS public.idx_profiles_email;

-- Remove email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update handle_new_user function to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;