
-- Add granular premium feature flags to feature_flags table
ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS enable_unlimited_readings    boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_advanced_spreads      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_ai_deep_analysis      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_audio_readings        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_relationship_analysis boolean DEFAULT true;

-- Ensure existing row has values set
UPDATE public.feature_flags
SET
  enable_unlimited_readings     = COALESCE(enable_unlimited_readings, true),
  enable_advanced_spreads       = COALESCE(enable_advanced_spreads, true),
  enable_ai_deep_analysis       = COALESCE(enable_ai_deep_analysis, true),
  enable_audio_readings         = COALESCE(enable_audio_readings, true),
  enable_relationship_analysis  = COALESCE(enable_relationship_analysis, true)
WHERE id = 1;
