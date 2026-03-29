/*
  # Add email column to appointments table

  1. Changes
    - Add `client_email` column to appointments table
    
  2. Notes
    - Email is required for appointment notifications
    - Uses ALTER TABLE to add the column
*/

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS client_email text NOT NULL DEFAULT '';