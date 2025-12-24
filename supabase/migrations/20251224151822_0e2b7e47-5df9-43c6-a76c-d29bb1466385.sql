-- Add server-side validation constraints for email_leads table
-- This prevents data poisoning and enforces proper formats

-- Email format validation (standard RFC 5322 simplified)
ALTER TABLE public.email_leads 
ADD CONSTRAINT email_format_check 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Email length constraint
ALTER TABLE public.email_leads 
ADD CONSTRAINT email_length_check 
CHECK (char_length(email) <= 255);

-- First name length constraint
ALTER TABLE public.email_leads 
ADD CONSTRAINT first_name_length_check 
CHECK (first_name IS NULL OR char_length(first_name) <= 100);

-- Consent text length constraint
ALTER TABLE public.email_leads 
ADD CONSTRAINT consent_text_length_check 
CHECK (char_length(consent_text) <= 500);

-- Add similar constraints to analytics_events and consent_logs

-- analytics_events: limit event_name and props size
ALTER TABLE public.analytics_events 
ADD CONSTRAINT event_name_length_check 
CHECK (char_length(event_name) <= 100);

ALTER TABLE public.analytics_events 
ADD CONSTRAINT anon_id_length_check 
CHECK (char_length(anon_id) <= 100);

-- consent_logs: limit anon_id and user_agent
ALTER TABLE public.consent_logs 
ADD CONSTRAINT consent_anon_id_length_check 
CHECK (char_length(anon_id) <= 100);

ALTER TABLE public.consent_logs 
ADD CONSTRAINT user_agent_length_check 
CHECK (user_agent IS NULL OR char_length(user_agent) <= 500);