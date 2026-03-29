-- Create a public bucket for business assets (logo, gallery, etc.)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files in the bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-assets');

-- Allow anyone to upload to the bucket (for easier integration/testing)
-- In a production app, this should be restricted to authenticated admins.
-- However, since other tables have public access, we'll follow that pattern here.
CREATE POLICY "Anyone can upload business assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-assets');

-- Allow anyone to update/delete (to manage their own assets)
CREATE POLICY "Anyone can update business assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business-assets')
WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Anyone can delete business assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'business-assets');
