-- Create reading_sessions table for persisting reading state
CREATE TABLE public.reading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  spread_id TEXT NOT NULL,
  question TEXT,
  selected_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  seed INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reading_results table for persisting AI interpretations
CREATE TABLE public.reading_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.reading_sessions(id) ON DELETE CASCADE,
  interpretation JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_results ENABLE ROW LEVEL SECURITY;

-- RLS for reading_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.reading_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.reading_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.reading_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for reading_results (via session ownership)
CREATE POLICY "Users can view their own results"
  ON public.reading_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reading_sessions
      WHERE reading_sessions.id = reading_results.session_id
      AND reading_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own results"
  ON public.reading_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reading_sessions
      WHERE reading_sessions.id = reading_results.session_id
      AND reading_sessions.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_created_at ON public.reading_sessions(created_at DESC);
CREATE INDEX idx_reading_results_session_id ON public.reading_results(session_id);