-- Block anonymous SELECT access to sensitive tables

-- email_leads: contains PII (emails, names, tokens)
CREATE POLICY "Block anonymous reads on email_leads"
ON public.email_leads
FOR SELECT
TO anon
USING (false);

-- consent_logs: contains privacy-sensitive tracking data (IP hashes, user agents)
CREATE POLICY "Block anonymous reads on consent_logs"
ON public.consent_logs
FOR SELECT
TO anon
USING (false);

-- analytics_events: block anonymous reads to protect business intelligence
CREATE POLICY "Block anonymous reads on analytics_events"
ON public.analytics_events
FOR SELECT
TO anon
USING (false);