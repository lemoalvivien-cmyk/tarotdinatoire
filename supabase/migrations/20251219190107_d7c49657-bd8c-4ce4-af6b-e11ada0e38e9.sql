-- =============================================
-- ADD MISSING COLUMNS TO tarot_spreads
-- =============================================

-- Add is_enabled column to control visibility (default true for existing spreads)
ALTER TABLE public.tarot_spreads 
ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT true;

-- Add layout_key for specific layout configurations (optional, defaults to id)
ALTER TABLE public.tarot_spreads 
ADD COLUMN IF NOT EXISTS layout_key text;

-- Add icon for display in catalog
ALTER TABLE public.tarot_spreads 
ADD COLUMN IF NOT EXISTS icon text;

-- Add sort_order for catalog ordering
ALTER TABLE public.tarot_spreads 
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;