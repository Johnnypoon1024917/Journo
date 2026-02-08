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
  
  -- Indexes
  CONSTRAINT bookings_type_check CHECK (type IN ('accommodation', 'transportation', 'activity', 'restaurant', 'other')),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('unpaid', 'paid', 'refunded'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();
