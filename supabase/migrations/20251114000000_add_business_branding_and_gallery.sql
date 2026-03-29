/*
  # Update business_data to include branding columns and RLS policies
  # Create business_gallery table for managing gallery images
*/

-- Add missing branding columns to business_data
ALTER TABLE IF EXISTS business_data
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS primary_color text,
ADD COLUMN IF NOT EXISTS accent_color text;

-- Add UPDATE policy for business_data so admins can save profile changes
DROP POLICY IF EXISTS "Anyone can update business data" ON business_data;
CREATE POLICY "Anyone can update business data"
  ON business_data FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create business_gallery table
CREATE TABLE IF NOT EXISTS business_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES business_data(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on business_gallery
ALTER TABLE business_gallery ENABLE ROW LEVEL SECURITY;

-- Allow public access to business_gallery (similar to other tables in this app)
DROP POLICY IF EXISTS "Anyone can read business gallery" ON business_gallery;
CREATE POLICY "Anyone can read business gallery"
  ON business_gallery FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create business gallery" ON business_gallery;
CREATE POLICY "Anyone can create business gallery"
  ON business_gallery FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update business gallery" ON business_gallery;
CREATE POLICY "Anyone can update business gallery"
  ON business_gallery FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete business gallery" ON business_gallery;
CREATE POLICY "Anyone can delete business gallery"
  ON business_gallery FOR DELETE
  USING (true);
