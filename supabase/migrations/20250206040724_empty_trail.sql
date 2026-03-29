/*
  # Update services table with current data

  1. Changes
    - Update existing services with current data
    - Add new services
    - Ensure all UUIDs match with frontend config

  2. Security
    - Maintain existing RLS policies
*/

-- First, ensure all services exist with correct data
INSERT INTO services (id, name, description, price, duration, active)
VALUES 
  ('123e4567-e89b-12d3-a456-426614174000', 'Corte de Cabello Clásico', 'Corte tradicional con tijeras y máquina', 90, 30, true),
  ('123e4567-e89b-12d3-a456-426614174001', 'Afeitado Tradicional', 'Afeitado con navaja y toalla caliente', 66, 30, true),
  ('123e4567-e89b-12d3-a456-426614174002', 'Colocación de Uñas', 'colocacion de gel fuerza', 300, 180, true),
  ('123e4567-e89b-12d3-a456-426614174003', 'Tinte de Cabello', 'Aplicación de tinte profesional', 390, 90, true),
  ('3f981c6b-452f-4d3d-8307-e5c34baef785', 'Corte de barba', 'Recorte de barba o rasurado completo', 60, 25, true),
  ('a4131d4d-1cdd-4328-aa9c-9681147c591f', 'Delineado de ceja', 'Contorno de cejas y delineado', 60, 25, true),
  ('b2bc4a4e-b3ef-4532-9d23-924b1809663f', 'masage corporal', 'espalda y cuello', 600, 60, true),
  ('c5e29c17-53ed-4869-a840-6f98d0b0564a', 'Corte desvanecido', 'Corte desde la navaja 0 en adelante', 160, 45, true)
ON CONFLICT (id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration,
  active = EXCLUDED.active;