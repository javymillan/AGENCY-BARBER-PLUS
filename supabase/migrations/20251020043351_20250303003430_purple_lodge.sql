/*
  # Add notes column to appointments table

  1. Changes
    - Add notes column to appointments table for storing client special requests or additional information
*/

-- Add notes column to appointments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE appointments ADD COLUMN notes text;
  END IF;
END $$;