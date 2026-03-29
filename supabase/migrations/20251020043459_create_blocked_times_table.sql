/*
  # Create blocked_times table

  1. New Tables
    - `blocked_times`
      - `id` (uuid, primary key)
      - `date` (date) - Date when time is blocked
      - `start_time` (time) - Block start time
      - `end_time` (time) - Block end time
      - `reason` (text, nullable) - Reason for blocking
      - `created_at` (timestamptz) - When block was created

  2. Security
    - Enable RLS on `blocked_times` table
    - Allow everyone to read blocked times
*/

CREATE TABLE IF NOT EXISTS blocked_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can read blocked times"
  ON blocked_times
  FOR SELECT
  USING (true);