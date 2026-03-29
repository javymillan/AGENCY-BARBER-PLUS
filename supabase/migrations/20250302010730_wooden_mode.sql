/*
  # Create business data table

  1. New Tables
    - business_data: Stores business information
      - id (uuid): Primary key
      - name (text): Business name
      - address (text): Business address
      - phone (text): Business phone number
      - logo_url (text): URL to business logo
      - cancellation_policy (text): Cancellation policy text
      - created_at (timestamptz): When record was created

  2. Security
    - Enable RLS on business_data table
    - Allow reading business data
*/

-- Create business_data table
CREATE TABLE IF NOT EXISTS business_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  logo_url text,
  cancellation_policy text,
  created_at timestamptz DEFAULT now()
);

-- Insert initial business data
INSERT INTO business_data (name, address, phone, logo_url, cancellation_policy)
VALUES (
  'Estética Profesional',
  'Av. Principal #123, Colonia Centro, Ciudad',
  '+526621234567',
  'https://example.com/logo.png',
  'Las citas pueden cancelarse o reprogramarse hasta 24 horas antes sin costo. Cancelaciones con menos tiempo tendrán un cargo del 50%.'
);

-- Enable RLS
ALTER TABLE business_data ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can read business data"
  ON business_data
  FOR SELECT
  USING (true);