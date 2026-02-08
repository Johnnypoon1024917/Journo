-- Create shopping_items table
CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Item details
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'clothing', 'toiletries', 'electronics', 'documents', 'food', 'other'
  quantity INTEGER DEFAULT 1,
  
  -- Status
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMP,
  purchased_by UUID REFERENCES users(id),
  
  -- Additional info
  notes TEXT,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high'
  estimated_price DECIMAL(10, 2),
  actual_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Store/location
  store_name VARCHAR(255),
  store_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT shopping_items_priority_check CHECK (priority IN ('low', 'normal', 'high')),
  CONSTRAINT shopping_items_quantity_check CHECK (quantity > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shopping_items_trip_id ON shopping_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_user_id ON shopping_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_is_purchased ON shopping_items(is_purchased);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON shopping_items(category);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_shopping_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_items_updated_at();
