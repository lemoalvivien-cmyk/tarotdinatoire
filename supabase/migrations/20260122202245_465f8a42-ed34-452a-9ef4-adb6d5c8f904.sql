-- Add SELECT policy for users to view their own analytics events
CREATE POLICY "Users can view their own analytics" 
ON public.analytics_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON POLICY "Users can view their own analytics" ON public.analytics_events IS 'Allows users to view their own analytics events for personal data export (GDPR compliance)';