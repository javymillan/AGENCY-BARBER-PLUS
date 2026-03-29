/*
  # Create business_hours table

  1. New Tables
    - `business_hours`
      - `id` (text, primary key)
      - `day_of_week` (text) - '0' for Sunday through '6' for Saturday
      - `start_time` (time) - Opening time
      - `end_time` (time) - Closing time
      - `is_closed` (boolean) - Whether business is closed this day
      - `break_start` (time, nullable) - Break start time
      - `break_end` (time, nullable) - Break end time
      - `location_id` (text, nullable) - For multi-location support

  2. Security
    - Enable RLS on `business_hours` table
    - Allow everyone to read business hours

  3. Default Data
    - Insert default business hours (Mon-Sat 9am-7pm with 2-3pm break, closed Sunday)
*/

CREATE TABLE IF NOT EXISTS business_hours (
  id text PRIMARY KEY,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_closed boolean DEFAULT false,
  break_start time,
  break_end time,
  location_id text
);

-- Enable Row Level Security
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can read business hours"
  ON business_hours
  FOR SELECT
  USING (true);

-- Insert default business hours for each day of the week
INSERT INTO business_hours (id, day_of_week, start_time, end_time, is_closed, break_start, break_end)
VALUES 
  ('day_0', '0', '09:00:00', '19:00:00', true, '14:00:00', '15:00:00'),  -- Sunday (closed)
  ('day_1', '1', '09:00:00', '19:00:00', false, '14:00:00', '15:00:00'), -- Monday
  ('day_2', '2', '09:00:00', '19:00:00', false, '14:00:00', '15:00:00'), -- Tuesday
  ('day_3', '3', '09:00:00', '19:00:00', false, '14:00:00', '15:00:00'), -- Wednesday
  ('day_4', '4', '09:00:00', '19:00:00', false, '14:00:00', '15:00:00'), -- Thursday
  ('day_5', '5', '09:00:00', '19:00:00', false, '14:00:00', '15:00:00'), -- Friday
  ('day_6', '6', '09:00:00', '19:00:00', false, '14:00:00', '15:00:00')  -- Saturday
ON CONFLICT (id) DO NOTHING;