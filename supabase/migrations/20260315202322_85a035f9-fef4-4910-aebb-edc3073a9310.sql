-- ─── Migration: ENABLE_MONETIZATION feature flag ──────────────────────────
-- Adds enable_monetization column (default FALSE = pure free mode)
-- Adds flag_audit_log jsonb for full auditability of flag changes

ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS enable_monetization boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_audit_log jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Set the initial value for row id=1
UPDATE public.feature_flags
SET enable_monetization = false,
    flag_audit_log = jsonb_build_array(
      jsonb_build_object(
        'changed_at', now()::text,
        'changed_by', 'system_migration',
        'flag',       'enable_monetization',
        'previous',   null,
        'new_value',  false,
        'reason',     'Initial setup — VERSION BÊTA GRATUITE, monetization disabled'
      )
    ),
    updated_at = now()
WHERE id = 1;