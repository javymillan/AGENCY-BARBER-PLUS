/*
  # Fix services table data

  1. Changes
    - Ensure services table exists
    - Re-insert service data with correct UUIDs
    - Update foreign key constraint
*/

-- First, ensure the services exist
INSERT INTO services (id, name, description, price, duration, active)
VALUES 
  ('123e4567-e89b-12d3-a456-426614174000', 'Corte de Cabello Clásico', 'Corte tradicional con tijeras y máquina', 20, 30, true),
  ('123e4567-e89b-12d3-a456-426614174001', 'Afeitado Tradicional', 'Afeitado con navaja y toalla caliente', 15, 30, true),
  ('123e4567-e89b-12d3-a456-426614174002', 'Corte + Barba', 'Combinación de corte de cabello y arreglo de barba', 30, 60, true),
  ('123e4567-e89b-12d3-a456-426614174003', 'Tinte de Cabello', 'Aplicación de tinte profesional', 45, 90, true)
ON CONFLICT (id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  active = EXCLUDED.active;