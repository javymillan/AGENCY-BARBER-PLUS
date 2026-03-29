/*
  # Update business address format

  1. Changes
    - Update business_data table with new formatted address
*/

UPDATE business_data 
SET address = 'Herminia Valencia 72a, Colonia Real de minas, Hermosillo'
WHERE id = (SELECT id FROM business_data LIMIT 1);