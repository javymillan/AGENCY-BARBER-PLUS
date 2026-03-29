/*
  # Crear tabla de testimonios y actualizar políticas

  1. Cambios
    - Crear tabla 'testimonials' para almacenar valoraciones de clientes
    - Añadir políticas RLS para permitir a usuarios anónimos crear y leer testimonios
    - Añadir índice para búsquedas eficientes
*/

-- Crear tabla de testimonios
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS testimonials_appointment_id_idx ON testimonials(appointment_id);
CREATE INDEX IF NOT EXISTS testimonials_is_featured_idx ON testimonials(is_featured);

-- Crear políticas RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Política para permitir a usuarios anónimos crear testimonios
CREATE POLICY "Anyone can create testimonials"
  ON testimonials
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política para permitir a usuarios anónimos leer testimonios
CREATE POLICY "Anyone can read testimonials"
  ON testimonials
  FOR SELECT
  TO anon
  USING (true);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();