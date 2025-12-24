-- Fix insecure UPDATE policy on email_leads
-- The "Anyone can unsubscribe via token" policy is too permissive
-- Unsubscribe flow now handled securely via Edge Function with service role

-- Drop the insecure policy that allows any anonymous user to update any row
DROP POLICY IF EXISTS "Anyone can unsubscribe via token" ON public.email_leads;

-- Add server-side question length validation for tarot_readings and reading_sessions
ALTER TABLE public.tarot_readings 
ADD CONSTRAINT tarot_readings_question_length_check 
CHECK (question IS NULL OR char_length(question) <= 500);

ALTER TABLE public.reading_sessions 
ADD CONSTRAINT reading_sessions_question_length_check 
CHECK (question IS NULL OR char_length(question) <= 500);