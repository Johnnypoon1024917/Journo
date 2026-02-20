-- Migration 044: Restore Active Tables
-- This migration restores tables that were incorrectly identified as unused
-- Created: 2026-02-18

-- ============================================================================
-- RESTORE BOOKINGS TABLE
-- ============================================================================

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Booking details
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'accommodation', 'transportation', 'activity', 'restaurant', 'other'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
  
  -- Date and time
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  
  -- Location
  location TEXT,
  address TEXT,
  
  -- Contact and confirmation
  confirmation_number VARCHAR(255),
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  website_url TEXT,
  
  -- Financial
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
  
  -- Additional info
  notes TEXT,
  attachments JSONB DEFAULT '[]', -- Array of file URLs/paths
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT bookings_type_check CHECK (type IN ('accommodation', 'transportation', 'activity', 'restaurant', 'other')),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('unpaid', 'paid', 'refunded'))
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(type);

-- Create updated_at trigger for bookings
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bookings_updated_at ON bookings;
CREATE TRIGGER trigger_update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- ============================================================================
-- RESTORE SHOPPING_ITEMS TABLE
-- ============================================================================

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

-- Create indexes for shopping_items
CREATE INDEX IF NOT EXISTS idx_shopping_items_trip_id ON shopping_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_user_id ON shopping_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_is_purchased ON shopping_items(is_purchased);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON shopping_items(category);

-- Create updated_at trigger for shopping_items
CREATE OR REPLACE FUNCTION update_shopping_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shopping_items_updated_at ON shopping_items;
CREATE TRIGGER trigger_update_shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_items_updated_at();

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Tables restored: 2
--   - bookings (actively used by BookingScreen and bookingController)
--   - shopping_items (actively used by shoppingController)
