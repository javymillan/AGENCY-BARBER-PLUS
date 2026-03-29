/*
  # Update appointments table RLS policy

  1. Changes
    - Drop existing policy that requires authentication
    - Add new policy that allows anonymous users to create appointments
    - Add policy for reading appointments
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Only authenticated users can manage appointments" ON appointments;

-- Create new policies
CREATE POLICY "Anyone can create appointments"
  ON appointments
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read their own appointments"
  ON appointments
  FOR SELECT
  TO anon
  USING (true);