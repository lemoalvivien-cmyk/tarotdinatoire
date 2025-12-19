-- Create analytics_events table for funnel tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  props JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_anon_id ON public.analytics_events(anon_id);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);

-- Composite index for funnel queries
CREATE INDEX idx_analytics_events_funnel ON public.analytics_events(event_name, created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (anonymous or logged in)
CREATE POLICY "Anyone can log events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view events
CREATE POLICY "Admins can view all events" 
ON public.analytics_events 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Prevent updates and deletes
CREATE POLICY "No updates allowed" 
ON public.analytics_events 
FOR UPDATE 
USING (false);

CREATE POLICY "No deletes allowed" 
ON public.analytics_events 
FOR DELETE 
USING (false);