-- P3 RGPD: Allow users to delete their own email_leads
CREATE POLICY "Users can delete their own leads"
ON public.email_leads
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own consent_logs
CREATE POLICY "Users can delete their own consent"
ON public.consent_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own analytics_events
CREATE POLICY "Users can delete their own analytics"
ON public.analytics_events
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own AI usage
CREATE POLICY "Users can delete their own ai_usage"
ON public.ai_usage_daily
FOR DELETE
USING (auth.uid() = user_id);