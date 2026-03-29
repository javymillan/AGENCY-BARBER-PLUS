/*
  # Fix business data table and policy

  1. Changes
    - Check if business_data table exists before creating
    - Check if policy exists before creating
    - Ensure business data is inserted only if not already present
*/

-- Check if business_data table exists and create if not
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_data') THEN
    -- Create business_data table
    CREATE TABLE business_data (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      address text NOT NULL,
      phone text NOT NULL,
      logo_url text,
      cancellation_policy text,
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE business_data ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Insert initial business data if not exists
INSERT INTO business_data (name, address, phone, logo_url, cancellation_policy)
SELECT 
  'DEMO BARBER',
  'Av. Principal #123, Colonia Centro, Ciudad',
  '+526621234567',
  'https://example.com/logo.png',
  'Las citas pueden cancelarse o reprogramarse hasta 24 horas antes sin costo. Cancelaciones con menos tiempo tendrán un cargo del 50%.'
WHERE NOT EXISTS (SELECT 1 FROM business_data LIMIT 1);

-- Check if policy exists before creating
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'business_data' AND policyname = 'Anyone can read business data'
  ) THEN
    -- Create policy
    CREATE POLICY "Anyone can read business data"
      ON business_data
      FOR SELECT
      USING (true);
  END IF;
END $$;