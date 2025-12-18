-- Function to bootstrap the first admin (only works if NO admin exists)
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(allowed_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  current_user_email text;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin already exists. Bootstrap not allowed.';
  END IF;
  
  -- Get current user's email from profiles
  SELECT email INTO current_user_email
  FROM public.profiles
  WHERE id = current_user_id;
  
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Check if email matches
  IF LOWER(current_user_email) != LOWER(allowed_email) THEN
    RAISE EXCEPTION 'Email mismatch. Your email does not match the allowed email.';
  END IF;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.admin_audit_logs (action, admin_user_id, target_id, target_type, metadata)
  VALUES ('bootstrap_first_admin', current_user_id, current_user_id::text, 'user', jsonb_build_object('email', current_user_email));
  
  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(text) TO authenticated;