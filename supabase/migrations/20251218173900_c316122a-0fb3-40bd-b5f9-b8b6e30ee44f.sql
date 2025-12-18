-- Add admin oversight for AI usage (legitimate security monitoring)
CREATE POLICY "Admins can view all usage" 
ON public.ai_usage_daily 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));