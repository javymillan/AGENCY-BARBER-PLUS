/*
  # Optimización de rendimiento y soporte para múltiples ubicaciones

  1. Cambios
    - Añadir índices para optimizar consultas frecuentes
    - Crear tabla de ubicaciones (locations)
    - Añadir relación entre business_data y locations
    - Añadir índice para la búsqueda de citas por fecha
*/

-- Añadir índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_phone ON appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);

-- Crear tabla de ubicaciones
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir columna location_id a business_data
ALTER TABLE business_data
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Añadir columna location_id a appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Añadir columna location_id a business_hours
ALTER TABLE business_hours
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Añadir columna location_id a blocked_times
ALTER TABLE blocked_times
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Crear políticas RLS para locations
CREATE POLICY "Anyone can read locations"
  ON locations
  FOR SELECT
  TO anon
  USING (true);