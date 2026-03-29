/*
  # Create appointment locks function and table

  1. New Tables
    - appointment_locks: Stores temporary locks for appointment time slots
      - id (uuid): Primary key
      - date (date): Appointment date
      - time (time): Appointment time
      - locked_by (text): Client identifier who locked the slot
      - locked_at (timestamptz): When the lock was created
      - expires_at (timestamptz): When the lock expires

  2. Functions
    - create_appointment_locks_table(): Creates the locks table and sets up RLS

  3. Security
    - Enable RLS on appointment_locks table
    - Allow public access for temporary locking mechanism
*/

-- Create the appointment_locks table creation function
CREATE OR REPLACE FUNCTION create_appointment_locks_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create appointment_locks table if it doesn't exist
  CREATE TABLE IF NOT EXISTS appointment_locks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    time time NOT NULL,
    locked_by text NOT NULL,
    locked_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL
  );

  -- Add unique constraint to prevent multiple locks for the same date/time
  DO $constraint$ 
  BEGIN
    ALTER TABLE appointment_locks ADD CONSTRAINT unique_lock_per_time_slot UNIQUE (date, time);
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $constraint$;

  -- Enable RLS
  ALTER TABLE appointment_locks ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable read access for all users" ON appointment_locks;
  DROP POLICY IF EXISTS "Enable insert access for all users" ON appointment_locks;
  DROP POLICY IF EXISTS "Enable update access for all users" ON appointment_locks;
  DROP POLICY IF EXISTS "Enable delete access for all users" ON appointment_locks;

  -- Create policies for appointment_locks table
  -- Allow public to manage locks (insert, select, update, delete)
  -- The locked_by field is used client-side to determine ownership
  CREATE POLICY "Enable read access for all users"
    ON appointment_locks
    FOR SELECT
    TO public
    USING (true);

  CREATE POLICY "Enable insert access for all users"
    ON appointment_locks
    FOR INSERT
    TO public
    WITH CHECK (true);

  CREATE POLICY "Enable update access for all users"
    ON appointment_locks
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "Enable delete access for all users"
    ON appointment_locks
    FOR DELETE
    TO public
    USING (true);

  -- Create index for efficient queries
  CREATE INDEX IF NOT EXISTS idx_appointment_locks_date_time ON appointment_locks(date, time);
  CREATE INDEX IF NOT EXISTS idx_appointment_locks_expires_at ON appointment_locks(expires_at);
END;
$$;

-- Create a function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM appointment_locks WHERE expires_at < NOW();
END;
$$;