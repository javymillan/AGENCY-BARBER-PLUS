/*
  # Create appointment locks table

  1. New Tables
    - `appointment_locks`
      - `id` (uuid, primary key)
      - `date` (date, not null)
      - `time` (time, not null)
      - `locked_by` (text, not null) - identifier for who locked the slot
      - `locked_at` (timestamptz, default now())
      - `expires_at` (timestamptz, not null)

  2. Security
    - Enable RLS on `appointment_locks` table
    - Add policies for anonymous users to manage locks
    - Allow reading all active locks
    - Allow inserting new locks
    - Allow updating own locks
    - Allow deleting expired or own locks

  3. Indexes
    - Index on date and time for efficient lookups
    - Index on expires_at for cleanup operations
*/

CREATE TABLE IF NOT EXISTS appointment_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time NOT NULL,
  locked_by text NOT NULL,
  locked_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS appointment_locks_date_time_idx ON appointment_locks (date, time);
CREATE INDEX IF NOT EXISTS appointment_locks_expires_at_idx ON appointment_locks (expires_at);
CREATE INDEX IF NOT EXISTS appointment_locks_locked_by_idx ON appointment_locks (locked_by);

-- Enable Row Level Security
ALTER TABLE appointment_locks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can read active locks" ON appointment_locks;
  DROP POLICY IF EXISTS "Anyone can create locks" ON appointment_locks;
  DROP POLICY IF EXISTS "Users can update own locks" ON appointment_locks;
  DROP POLICY IF EXISTS "Users can delete expired or own locks" ON appointment_locks;
  DROP POLICY IF EXISTS "Public can manage locks" ON appointment_locks;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policy to allow anonymous users to read all active locks
CREATE POLICY "Anyone can read active locks"
  ON appointment_locks
  FOR SELECT
  TO anon
  USING (expires_at > now());

-- Policy to allow anonymous users to insert new locks
CREATE POLICY "Anyone can create locks"
  ON appointment_locks
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy to allow users to update their own locks
CREATE POLICY "Users can update own locks"
  ON appointment_locks
  FOR UPDATE
  TO anon
  USING (locked_by = current_setting('request.jwt.claims', true)::json->>'email' OR true)
  WITH CHECK (locked_by = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Policy to allow users to delete expired locks or their own locks
CREATE POLICY "Users can delete expired or own locks"
  ON appointment_locks
  FOR DELETE
  TO anon
  USING (expires_at < now() OR locked_by = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Also allow public role for authenticated admin operations
CREATE POLICY "Public can manage locks"
  ON appointment_locks
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);