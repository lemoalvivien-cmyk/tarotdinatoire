-- Add admin_bootstrap_used flag to feature_flags (one-shot protection)
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS admin_bootstrap_used BOOLEAN NOT NULL DEFAULT false;