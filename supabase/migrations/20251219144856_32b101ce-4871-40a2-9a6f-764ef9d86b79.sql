-- Create storage bucket for tarot card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('tarot-cards', 'tarot-cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can view tarot card images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload tarot card images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update tarot card images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete tarot card images" ON storage.objects;

-- SELECT policy: Anyone can view (public bucket)
CREATE POLICY "Public can view tarot card images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tarot-cards');

-- INSERT policy: Only admins can upload
CREATE POLICY "Admins can upload tarot card images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tarot-cards' 
  AND public.is_admin(auth.uid())
);

-- UPDATE policy: Only admins can update
CREATE POLICY "Admins can update tarot card images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'tarot-cards' 
  AND public.is_admin(auth.uid())
);

-- DELETE policy: Only admins can delete
CREATE POLICY "Admins can delete tarot card images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'tarot-cards' 
  AND public.is_admin(auth.uid())
);