/*
  # Update business hours for Sunday

  1. Changes
    - Set Sunday (day_of_week = 0) to is_closed = true
*/

UPDATE business_hours 
SET is_closed = true
WHERE day_of_week = 0;