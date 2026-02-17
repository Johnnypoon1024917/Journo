-- Budget Management System Migration
-- Creates tables for budget configuration and expense tracking

-- Budget Configuration Table
CREATE TABLE IF NOT EXISTS budget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  total_budget DECIMAL(12, 2) NOT NULL CHECK (total_budget > 0),
  home_currency VARCHAR(3) NOT NULL DEFAULT 'HKD',
  trip_currency VARCHAR(3) NOT NULL,
  category_allocations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id)
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('flights', 'accommodation', 'food', 'transport', 'activities', 'shopping', 'misc')),
  date DATE NOT NULL,
  note TEXT,
  paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
  split_with UUID[],
  split_type VARCHAR(20) CHECK (split_type IN ('equal', 'custom')),
  custom_splits JSONB,
  is_settled BOOLEAN DEFAULT FALSE,
  linked_item_id UUID,
  linked_item_type VARCHAR(20) CHECK (linked_item_type IN ('reservation', 'shopping', 'itinerary')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error'))
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_budget_configs_trip_id ON budget_configs(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_date ON expenses(trip_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_category ON expenses(trip_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_settled ON expenses(trip_id, is_settled);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_linked_item ON expenses(linked_item_id, linked_item_type);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_sync_status ON expenses(sync_status);

-- Trigger to update updated_at timestamp for budget_configs
CREATE OR REPLACE FUNCTION update_budget_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget_configs_updated_at
  BEFORE UPDATE ON budget_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_configs_updated_at();

-- Trigger to update updated_at timestamp for expenses
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Comments for documentation
COMMENT ON TABLE budget_configs IS 'Stores budget configuration for each trip including total budget and category allocations';
COMMENT ON TABLE expenses IS 'Stores individual expense entries with support for group splitting and linking to other items';

COMMENT ON COLUMN budget_configs.category_allocations IS 'JSONB structure: {"allocations": [{"category": "flights", "percentage": 30, "allocatedAmount": 3000}, ...]}';
COMMENT ON COLUMN expenses.custom_splits IS 'JSONB structure: {"splits": [{"userId": "uuid", "amount": 100.50}, ...]}';
COMMENT ON COLUMN expenses.split_with IS 'Array of user IDs who share this expense';
COMMENT ON COLUMN expenses.linked_item_id IS 'UUID of linked reservation, shopping item, or itinerary item';
COMMENT ON COLUMN expenses.sync_status IS 'Tracks synchronization status for offline support';
