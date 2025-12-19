-- Create consent_logs table for GDPR cookie consent tracking
CREATE TABLE public.consent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anon_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  choices JSONB NOT NULL DEFAULT '{}',
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_consent_logs_anon_id ON public.consent_logs(anon_id);
CREATE INDEX idx_consent_logs_user_id ON public.consent_logs(user_id);
CREATE INDEX idx_consent_logs_created_at ON public.consent_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their own consent (anon or logged in)
CREATE POLICY "Anyone can log consent" 
ON public.consent_logs 
FOR INSERT 
WITH CHECK (true);

-- Users can view their own consent logs
CREATE POLICY "Users can view own consent" 
ON public.consent_logs 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() IS NULL
);

-- Admins can view all consent logs
CREATE POLICY "Admins can view all consent" 
ON public.consent_logs 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_consent_logs_updated_at
BEFORE UPDATE ON public.consent_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();