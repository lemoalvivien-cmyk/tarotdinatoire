-- Create validation function for tarot card IDs
CREATE OR REPLACE FUNCTION public.validate_tarot_card_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate major arcana: major_00 to major_21 (zero-padded 2 digits)
  IF NEW.type = 'major' THEN
    IF NEW.id !~ '^major_([0-1][0-9]|2[0-1])$' THEN
      RAISE EXCEPTION 'Invalid major arcana ID format: %. Expected: major_00 to major_21', NEW.id;
    END IF;
  -- Validate minor arcana: minor_{suit}_{rank} without zero-padding
  ELSIF NEW.type = 'minor' THEN
    IF NEW.id !~ '^minor_(wands|cups|swords|pentacles)_(ace|[2-9]|10|page|knight|queen|king)$' THEN
      RAISE EXCEPTION 'Invalid minor arcana ID format: %. Expected: minor_{suit}_{ace|2-10|page|knight|queen|king}', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce validation on INSERT and UPDATE
DROP TRIGGER IF EXISTS validate_tarot_card_id_trigger ON public.tarot_cards;
CREATE TRIGGER validate_tarot_card_id_trigger
  BEFORE INSERT OR UPDATE ON public.tarot_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tarot_card_id();