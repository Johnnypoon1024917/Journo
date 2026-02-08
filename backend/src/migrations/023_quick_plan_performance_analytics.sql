-- Quick Plan Performance and Analytics Tables

-- Performance tracking sessions
CREATE TABLE IF NOT EXISTS quick_plan_performance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  destination TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  total_duration INTEGER, -- milliseconds
  stage TEXT CHECK (stage IN ('form_submission', 'place_search', 'route_optimization', 'trip_creation', 'completed', 'error')),
  
  -- Performance metrics
  generation_time INTEGER, -- milliseconds
  places_found INTEGER,
  route_optimization_time INTEGER, -- milliseconds
  weather_api_time INTEGER, -- milliseconds
  cache_hit_rate DECIMAL(3,2),
  external_api_calls INTEGER,
  error_count INTEGER DEFAULT 0,
  
  -- User feedback
  user_satisfaction_score DECIMAL(2,1), -- 1.0 to 5.0
  user_feedback JSONB,
  
  -- Metadata
  session_metadata JSONB,
  error_details TEXT,
  ab_test_variant TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Performance alerts
CREATE TABLE IF NOT EXISTS quick_plan_performance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT CHECK (alert_type IN ('slow_generation', 'high_error_rate', 'low_cache_hit', 'api_timeout', 'user_satisfaction')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  threshold_value DECIMAL(10,2),
  actual_value DECIMAL(10,2),
  destination TEXT,
  session_id UUID REFERENCES quick_plan_performance_sessions(id),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cache request tracking
CREATE TABLE IF NOT EXISTS quick_plan_cache_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination TEXT NOT NULL,
  cache_hit BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- External API call tracking
CREATE TABLE IF NOT EXISTS external_api_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_service TEXT CHECK (api_service IN ('google_places', 'google_directions', 'weather_api', 'location_scraper')),
  response_time_ms INTEGER NOT NULL,
  error_occurred BOOLEAN DEFAULT FALSE,
  timeout_occurred BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage analytics
CREATE TABLE IF NOT EXISTS quick_plan_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES quick_plan_performance_sessions(id),
  destination TEXT NOT NULL,
  interests JSONB, -- Array of interest strings
  budget_level TEXT CHECK (budget_level IN ('low', 'medium', 'high')),
  travel_style TEXT CHECK (travel_style IN ('relaxed', 'moderate', 'fast-paced')),
  group_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User customizations tracking
CREATE TABLE IF NOT EXISTS quick_plan_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES quick_plan_performance_sessions(id),
  customization_type TEXT CHECK (customization_type IN ('place_removal', 'place_replacement', 'regeneration', 'count_adjustment')),
  customization_data JSONB, -- Details about the customization
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversion tracking (suggestions to trips)
CREATE TABLE IF NOT EXISTS quick_plan_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES quick_plan_performance_sessions(id),
  trip_id UUID REFERENCES trips(id),
  suggestions_count INTEGER,
  customizations_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- A/B testing framework
CREATE TABLE IF NOT EXISTS quick_plan_ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_name TEXT NOT NULL,
  variants JSONB NOT NULL, -- Array of variant objects
  traffic_split JSONB NOT NULL, -- Array of percentages
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qp_perf_sessions_user_id ON quick_plan_performance_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_qp_perf_sessions_destination ON quick_plan_performance_sessions(destination);
CREATE INDEX IF NOT EXISTS idx_qp_perf_sessions_created_at ON quick_plan_performance_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_qp_perf_sessions_stage ON quick_plan_performance_sessions(stage);

CREATE INDEX IF NOT EXISTS idx_qp_perf_alerts_type ON quick_plan_performance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_qp_perf_alerts_severity ON quick_plan_performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_qp_perf_alerts_created_at ON quick_plan_performance_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_qp_perf_alerts_resolved ON quick_plan_performance_alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_qp_cache_requests_destination ON quick_plan_cache_requests(destination);
CREATE INDEX IF NOT EXISTS idx_qp_cache_requests_created_at ON quick_plan_cache_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_qp_cache_requests_cache_hit ON quick_plan_cache_requests(cache_hit);

CREATE INDEX IF NOT EXISTS idx_external_api_calls_service ON external_api_calls(api_service);
CREATE INDEX IF NOT EXISTS idx_external_api_calls_created_at ON external_api_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_external_api_calls_error ON external_api_calls(error_occurred);

CREATE INDEX IF NOT EXISTS idx_qp_usage_analytics_user_id ON quick_plan_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_qp_usage_analytics_destination ON quick_plan_usage_analytics(destination);
CREATE INDEX IF NOT EXISTS idx_qp_usage_analytics_created_at ON quick_plan_usage_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_qp_customizations_user_id ON quick_plan_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_qp_customizations_session_id ON quick_plan_customizations(session_id);
CREATE INDEX IF NOT EXISTS idx_qp_customizations_type ON quick_plan_customizations(customization_type);
CREATE INDEX IF NOT EXISTS idx_qp_customizations_created_at ON quick_plan_customizations(created_at);

CREATE INDEX IF NOT EXISTS idx_qp_conversions_user_id ON quick_plan_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_qp_conversions_session_id ON quick_plan_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_qp_conversions_created_at ON quick_plan_conversions(created_at);

CREATE INDEX IF NOT EXISTS idx_qp_ab_tests_status ON quick_plan_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_qp_ab_tests_created_at ON quick_plan_ab_tests(created_at);

-- Add performance tracking columns to existing quick_plan_sessions table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quick_plan_sessions') THEN
    -- Add performance tracking columns
    ALTER TABLE quick_plan_sessions 
    ADD COLUMN IF NOT EXISTS generation_time_ms INTEGER,
    ADD COLUMN IF NOT EXISTS cache_hit_rate DECIMAL(3,2),
    ADD COLUMN IF NOT EXISTS external_api_calls INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS user_satisfaction_score DECIMAL(2,1);
  END IF;
END $$;