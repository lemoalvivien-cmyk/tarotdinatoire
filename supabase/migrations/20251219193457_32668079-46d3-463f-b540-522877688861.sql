-- Create email_leads table for GDPR-compliant lead capture
CREATE TABLE public.email_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  user_id UUID,
  spread_id TEXT,
  session_id UUID REFERENCES public.reading_sessions(id) ON DELETE SET NULL,
  consent BOOLEAN NOT NULL DEFAULT false,
  consent_text TEXT NOT NULL,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token UUID DEFAULT gen_random_uuid(),
  verification_sent_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on email (one lead per email)
CREATE UNIQUE INDEX idx_email_leads_email ON public.email_leads(email);

-- Indexes for performance
CREATE INDEX idx_email_leads_user_id ON public.email_leads(user_id);
CREATE INDEX idx_email_leads_session_id ON public.email_leads(session_id);
CREATE INDEX idx_email_leads_unsubscribe_token ON public.email_leads(unsubscribe_token);
CREATE INDEX idx_email_leads_verification_token ON public.email_leads(verification_token);

-- Enable RLS
ALTER TABLE public.email_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own leads (if logged in)
CREATE POLICY "Users can view their own leads"
  ON public.email_leads FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Anyone can insert (for anonymous lead capture)
CREATE POLICY "Anyone can insert leads with consent"
  ON public.email_leads FOR INSERT
  WITH CHECK (consent = true);

-- Users can update their own leads
CREATE POLICY "Users can update their own leads"
  ON public.email_leads FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all leads
CREATE POLICY "Admins can view all leads"
  ON public.email_leads FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update all leads
CREATE POLICY "Admins can update all leads"
  ON public.email_leads FOR UPDATE
  USING (is_admin(auth.uid()));

-- Add double_opt_in feature flag
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS double_opt_in BOOLEAN DEFAULT false;

-- Trigger for updated_at
CREATE TRIGGER update_email_leads_updated_at
  BEFORE UPDATE ON public.email_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();