-- Create countries table for travel recommendations
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Country information
  country_name TEXT NOT NULL,
  region TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Travel timing
  best_months INTEGER[] NOT NULL,
  avoid_months INTEGER[],
  
  -- Weather information
  temp_range TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT countries_region_check CHECK (region IN ('Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East')),
  CONSTRAINT countries_best_months_not_empty CHECK (array_length(best_months, 1) > 0)
);

-- Create GIN indexes for array fields (efficient for array containment queries)
CREATE INDEX IF NOT EXISTS idx_countries_best_months ON countries USING GIN (best_months);
CREATE INDEX IF NOT EXISTS idx_countries_avoid_months ON countries USING GIN (avoid_months);

-- Create B-tree index for region field (efficient for equality and sorting)
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_countries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_countries_updated_at
  BEFORE UPDATE ON countries
  FOR EACH ROW
  EXECUTE FUNCTION update_countries_updated_at();
