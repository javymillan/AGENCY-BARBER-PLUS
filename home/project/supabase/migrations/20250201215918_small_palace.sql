/*
  # Create initial schema for barbershop

  1. New Tables
    - services: Stores available services
      - id (uuid): Primary key
      - name (text): Service name
      - description (text): Service description
      - price (integer): Service price
      - duration (integer): Service duration in minutes
      - active (boolean): Whether service is currently available
      - created_at (timestamptz): When service was created
    
    - appointments: Stores customer appointments
      - id (uuid): Primary key
      - service_id (uuid): Reference to services table
      - client_name (text): Customer name
      - client_phone (text): Customer phone number
      - date (date): Appointment date
      - time (time): Appointment time
      - status (text): Appointment status
      - created_at (timestamptz): When appointment was created

  2. Security
    - Enable RLS on both tables
    - Allow reading active services
    - Allow authenticated users to manage appointments
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price integer NOT NULL,
  duration integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Insert initial services
INSERT INTO services (id, name, description, price, duration, active) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'Corte de Cabello Clásico', 'Corte tradicional con tijeras y máquina', 20, 30, true),
  ('123e4567-e89b-12d3-a456-426614174001', 'Afeitado Tradicional', 'Afeitado con navaja y toalla caliente', 15, 30, true),
  ('123e4567-e89b-12d3-a456-426614174002', 'Corte + Barba', 'Combinación de corte de cabello y arreglo de barba', 30, 60, true),
  ('123e4567-e89b-12d3-a456-426614174003', 'Tinte de Cabello', 'Aplicación de tinte profesional', 45, 90, true);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id),
  client_name text NOT NULL,
  client_phone text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read active services"
  ON services
  FOR SELECT
  USING (active = true);

CREATE POLICY "Only authenticated users can manage appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);