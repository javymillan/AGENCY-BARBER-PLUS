/*
  # Fix RLS policies for appointments table

  1. Changes
    - Drop existing restrictive policies
    - Create new permissive policies that allow public access
    - Ensure data is visible in Supabase UI

  2. Security
    - Anyone can read appointments (for UI purposes)
    - Anyone can create appointments (public booking)
    - Anyone can update appointments (for status changes)
*/

DROP POLICY IF EXISTS "Anyone can read their own appointments" ON appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;

CREATE POLICY "Anyone can read appointments"
  ON appointments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update appointments"
  ON appointments FOR UPDATE
  USING (true)
  WITH CHECK (true);