-- Paketa 55: Heqje e politikave SELECT që lejonin listim të skedarëve në buckets publike
--
-- Konteksti: Buckets `avatars`, `school-assets`, `teacher-profiles` janë
-- publike (bucket.public = true). Politikat SELECT që janë `USING (bucket_id = X)`
-- lejonin çdo klient të bëjë listim të të gjitha skedarëve në bucket.
--
-- Kjo nuk është e nevojshme: buckets publike japin qasje direkte përmes URL
-- (https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>),
-- që nuk kërkon SELECT policy.
--
-- Heqja e politikave bllokon listing (storage.objects.list) por ruajn aksesin
-- përmes URL publike — që është sjellja e dëshiruar.
--
-- Adresim i Supabase linter warning: public_bucket_allows_listing (3 buckets)

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "school_assets_public_read" ON storage.objects;
DROP POLICY IF EXISTS "public_view_teacher_profiles" ON storage.objects;
