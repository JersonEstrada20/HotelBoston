-- Optional guest photos are stored separately from general public uploads.
ALTER TABLE public.guest_review
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.guest_review
  DROP CONSTRAINT IF EXISTS guest_review_photo_url_valid;
ALTER TABLE public.guest_review
  ADD CONSTRAINT guest_review_photo_url_valid CHECK (
    photo_url IS NULL OR (
      length(photo_url) <= 2048
      AND photo_url LIKE '%/storage/v1/object/public/guest-review-photos/pending/%'
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('guest-review-photos', 'guest-review-photos', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS guest_review_photo_upload ON storage.objects;
CREATE POLICY guest_review_photo_upload ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'guest-review-photos'
    AND (storage.foldername(name))[1] = 'pending'
  );

DROP POLICY IF EXISTS guest_review_photo_public_read ON storage.objects;
CREATE POLICY guest_review_photo_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'guest-review-photos');

DROP POLICY IF EXISTS guest_review_photo_staff_delete ON storage.objects;
CREATE POLICY guest_review_photo_staff_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'guest-review-photos'
    AND public.current_user_role() = 'admin'
  );
