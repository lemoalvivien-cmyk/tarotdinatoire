
-- ─── 1. Activer l'extension pgvector ───────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ─── 2. Table user_embeddings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_embeddings (
  id            UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID    NOT NULL,
  draw_id       UUID    NOT NULL UNIQUE,
  embedding     extensions.vector(32) NOT NULL,
  card_id       TEXT    NOT NULL,
  orientation   TEXT    NOT NULL DEFAULT 'upright',
  themes        TEXT[]  NOT NULL DEFAULT '{}',
  energy_score  INTEGER NOT NULL DEFAULT 5,
  draw_date     DATE    NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ─── 3. Index HNSW pour cosine similarity ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_embeddings_hnsw
  ON public.user_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_user_embeddings_user_id
  ON public.user_embeddings (user_id);

CREATE INDEX IF NOT EXISTS idx_user_embeddings_draw_date
  ON public.user_embeddings (user_id, draw_date DESC);

-- ─── 4. RLS strict ────────────────────────────────────────────────────────
ALTER TABLE public.user_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own embeddings"
  ON public.user_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert embeddings"
  ON public.user_embeddings FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update embeddings"
  ON public.user_embeddings FOR UPDATE
  USING  (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can delete own embeddings"
  ON public.user_embeddings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all embeddings"
  ON public.user_embeddings FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ─── 5. Fonction find_similar_draws ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.find_similar_draws(
  p_user_id       UUID,
  p_embedding     extensions.vector(32),
  p_limit         INTEGER DEFAULT 3,
  p_exclude_id    UUID    DEFAULT NULL
)
RETURNS TABLE (
  draw_id      UUID,
  card_id      TEXT,
  orientation  TEXT,
  themes       TEXT[],
  energy_score INTEGER,
  draw_date    DATE,
  similarity   FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    ue.draw_id,
    ue.card_id,
    ue.orientation,
    ue.themes,
    ue.energy_score,
    ue.draw_date,
    1 - (ue.embedding <=> p_embedding) AS similarity
  FROM public.user_embeddings ue
  WHERE ue.user_id = p_user_id
    AND (p_exclude_id IS NULL OR ue.draw_id != p_exclude_id)
  ORDER BY ue.embedding <=> p_embedding
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.find_similar_draws FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_similar_draws TO service_role;
