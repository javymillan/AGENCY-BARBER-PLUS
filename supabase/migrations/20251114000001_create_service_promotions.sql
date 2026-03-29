CREATE TABLE IF NOT EXISTS service_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  name text NOT NULL,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_of_week integer[] DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read service promotions"
  ON service_promotions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create service promotions"
  ON service_promotions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update service promotions"
  ON service_promotions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete service promotions"
  ON service_promotions FOR DELETE
  USING (true);
