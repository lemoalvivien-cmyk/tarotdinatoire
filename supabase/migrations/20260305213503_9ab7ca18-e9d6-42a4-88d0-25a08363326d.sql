
-- Add astrology fields to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS zodiac_sign text;
