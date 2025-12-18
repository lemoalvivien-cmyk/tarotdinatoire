-- =============================================
-- CLEAN UP: Drop existing tables and start fresh
-- =============================================
DROP TABLE IF EXISTS public.readings CASCADE;
DROP TABLE IF EXISTS public.tarot_cards CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.reading_type CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.card_type AS ENUM ('major', 'minor');

-- =============================================
-- TABLE: profiles
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  intention TEXT,
  preferred_domain TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: user_roles (separate for security - NO is_admin on profiles)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: tarot_cards
-- =============================================
CREATE TABLE public.tarot_cards (
  id TEXT PRIMARY KEY,  -- e.g., major_00, major_01, minor_wands_ace
  type card_type NOT NULL,
  numero INTEGER,
  nom_fr TEXT NOT NULL,
  name_en TEXT,
  meaning_upright TEXT,
  meaning_reversed TEXT,
  meaning_upright_fr TEXT,
  meaning_reversed_fr TEXT,
  keywords TEXT[],
  keywords_fr TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tarot_cards_type ON public.tarot_cards(type);
CREATE INDEX idx_tarot_cards_nom_fr ON public.tarot_cards(nom_fr);

ALTER TABLE public.tarot_cards ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: tarot_spreads
-- =============================================
CREATE TABLE public.tarot_spreads (
  id TEXT PRIMARY KEY,  -- one_card, three_cards, celtic_cross
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description TEXT,
  description_fr TEXT,
  positions JSONB NOT NULL DEFAULT '[]',  -- [{key, label, description, order}]
  card_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.tarot_spreads ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: tarot_readings
-- =============================================
CREATE TABLE public.tarot_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  spread_id TEXT REFERENCES public.tarot_spreads(id),
  question TEXT,
  cards JSONB NOT NULL DEFAULT '[]',  -- [{card_id, orientation, position_key}]
  ai_interpretation JSONB,  -- structured interpretation
  user_notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_readings_user_created ON public.tarot_readings(user_id, created_at DESC);
CREATE INDEX idx_readings_user_favorite ON public.tarot_readings(user_id, is_favorite);
CREATE INDEX idx_readings_spread ON public.tarot_readings(spread_id);

ALTER TABLE public.tarot_readings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: ai_prompt_templates
-- =============================================
CREATE TABLE public.ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,  -- tarot_system, tarot_style, safety_rules, json_schema
  content TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ai_prompts_key ON public.ai_prompt_templates(key);

ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: admin_audit_logs
-- =============================================
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_admin ON public.admin_audit_logs(admin_user_id);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: feature_flags (singleton)
-- =============================================
CREATE TABLE public.feature_flags (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Singleton pattern
  enable_billing BOOLEAN DEFAULT FALSE,
  enable_waitlist BOOLEAN DEFAULT FALSE,
  enable_shop BOOLEAN DEFAULT FALSE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Insert default row
INSERT INTO public.feature_flags (id) VALUES (1);

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Convenience function for admin check
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- =============================================
-- RLS POLICIES: profiles
-- =============================================
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: user_roles
-- =============================================
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: tarot_cards (public read, admin write)
-- =============================================
CREATE POLICY "Anyone can view tarot cards"
  ON public.tarot_cards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert tarot cards"
  ON public.tarot_cards FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update tarot cards"
  ON public.tarot_cards FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete tarot cards"
  ON public.tarot_cards FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: tarot_spreads (public read, admin write)
-- =============================================
CREATE POLICY "Anyone can view spreads"
  ON public.tarot_spreads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert spreads"
  ON public.tarot_spreads FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update spreads"
  ON public.tarot_spreads FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete spreads"
  ON public.tarot_spreads FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: tarot_readings
-- =============================================
CREATE POLICY "Users can view their own readings"
  ON public.tarot_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own readings"
  ON public.tarot_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own readings"
  ON public.tarot_readings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own readings"
  ON public.tarot_readings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all readings"
  ON public.tarot_readings FOR SELECT
  USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: ai_prompt_templates (admin only)
-- =============================================
CREATE POLICY "Admins can view prompts"
  ON public.ai_prompt_templates FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert prompts"
  ON public.ai_prompt_templates FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update prompts"
  ON public.ai_prompt_templates FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete prompts"
  ON public.ai_prompt_templates FOR DELETE
  USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: admin_audit_logs (admin only)
-- =============================================
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES: feature_flags (admin read/write, public read)
-- =============================================
CREATE POLICY "Anyone can view feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply to feature_flags
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply to ai_prompt_templates
CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON public.ai_prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HANDLE NEW USER SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();