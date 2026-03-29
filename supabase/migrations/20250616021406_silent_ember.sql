/*
  # Fix booking rules RLS policies

  1. Changes
    - Safely drop existing policies if they exist
    - Create new policies that allow proper access for all users
    - Handle cases where policies might already exist
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop existing restrictive policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_rules' AND policyname = 'Anyone can read booking rules'
  ) THEN
    DROP POLICY "Anyone can read booking rules" ON booking_rules;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_rules' AND policyname = 'Allow anon to insert default booking rules'
  ) THEN
    DROP POLICY "Allow anon to insert default booking rules" ON booking_rules;
  END IF;

  -- Drop any existing new policies in case they were partially created
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_rules' AND policyname = 'Enable read access for all users'
  ) THEN
    DROP POLICY "Enable read access for all users" ON booking_rules;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_rules' AND policyname = 'Enable insert access for all users'
  ) THEN
    DROP POLICY "Enable insert access for all users" ON booking_rules;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_rules' AND policyname = 'Enable update access for all users'
  ) THEN
    DROP POLICY "Enable update access for all users" ON booking_rules;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_rules' AND policyname = 'Enable delete access for all users'
  ) THEN
    DROP POLICY "Enable delete access for all users" ON booking_rules;
  END IF;
END $$;

-- Create new policies that allow proper access
CREATE POLICY "Enable read access for all users"
  ON booking_rules
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON booking_rules
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON booking_rules
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON booking_rules
  FOR DELETE
  TO public
  USING (true);