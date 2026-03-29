/*
  # Add business data

  1. Insert Data
    - Add initial business data record with contact information
*/

INSERT INTO business_data (name, address, phone, cancellation_policy)
VALUES (
  'DEMO BARBER',
  'Av. Principal #123, Ciudad Demo',
  '+525512345678',
  'Por favor cancela con al menos 24 horas de anticipación'
) ON CONFLICT (id) DO NOTHING;