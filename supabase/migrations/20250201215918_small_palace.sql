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

    - booking_rules: Stores business booking configuration
      - id (text): Primary key
      - appointment_duration (bigint): Default appointment duration
      - min_advance_time (bigint): Minimum advance booking time
      - max_appointments_per_day (bigint): Maximum daily appointments
      - max_appointments_per_week (bigint): Maximum weekly appointments
      - min_cancellation_notice (bigint): Minimum cancellation notice
      - num_de_empleados (bigint): Number of concurrent appointments

  2. Security
    - Enable RLS on all tables
    - Allow reading active services
    - Allow authenticated users to manage appointments
    - Allow anonymous users to read and insert default booking rules
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

-- Create booking_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS booking_rules (
  id text PRIMARY KEY,
  appointment_duration bigint,
  min_advance_time bigint,
  max_appointments_per_day bigint,
  max_appointments_per_week bigint,
  min_cancellation_notice bigint,
  created_at timestamptz,
  updated_at timestamptz,
  num_de_empleados bigint
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rules ENABLE ROW LEVEL SECURITY;

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

-- Add policies for booking_rules
CREATE POLICY "Anyone can read booking rules"
  ON booking_rules
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert default booking rules"
  ON booking_rules
  FOR INSERT
  TO anon
  WITH CHECK (id = 'default');