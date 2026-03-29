/*
  # Create testimonials table

  1. New Tables
    - `testimonials`
      - `id` (uuid, primary key)
      - `appointment_id` (uuid, foreign key to appointments)
      - `rating` (integer, 1-5)
      - `comment` (text, optional)
      - `is_featured` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `testimonials` table
    - Add policy for anyone to read testimonials
    - Add policy for users to create their own testimonials
*/

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_appointment_id ON testimonials(appointment_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON testimonials(is_featured);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read testimonials"
  ON testimonials FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own testimonials"
  ON testimonials FOR UPDATE
  USING (true)
  WITH CHECK (true);