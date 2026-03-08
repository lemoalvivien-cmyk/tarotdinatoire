
-- ══════════════════════════════════════════════════════════
-- MIGRATION: Idempotency scoped par (created_by, idempotency_key)
-- Remplace toute contrainte UNIQUE globale sur idempotency_key
-- par un index unique PARTIEL scopé par créateur
-- ══════════════════════════════════════════════════════════

-- 1. Supprimer l'ancienne contrainte globale si elle existe
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.agent_jobs'::regclass
    AND contype = 'u'
    AND conname ILIKE '%idempotency%'
  LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.agent_jobs DROP CONSTRAINT ' || quote_ident(v_constraint_name);
  END IF;
END
$$;

-- 2. Supprimer les anciens index globaux sur idempotency_key
DROP INDEX IF EXISTS public.agent_jobs_idempotency_key_key;
DROP INDEX IF EXISTS public.idx_agent_jobs_idempotency_key;
DROP INDEX IF EXISTS public.agent_jobs_idempotency_key_idx;

-- 3. Index unique PARTIEL scopé par (created_by, idempotency_key)
--    WHERE idempotency_key IS NOT NULL
--    → même clé utilisable par deux admins différents sans collision
--    → un même admin ne peut pas créer deux jobs avec la même clé
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_jobs_idem_scoped
  ON public.agent_jobs (created_by, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
