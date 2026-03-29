/*
  # Add num_de_empleados column to booking_rules

  1. Changes
    - Add num_de_empleados column to booking_rules table
    - Set default value to 1 for existing records
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'booking_rules' AND column_name = 'num_de_empleados'
  ) THEN
    ALTER TABLE booking_rules ADD COLUMN num_de_empleados integer DEFAULT 1 NOT NULL;
  END IF;
END $$;