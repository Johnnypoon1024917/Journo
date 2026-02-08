-- Complete database schema for Journo application
-- This migration creates all necessary tables in the correct order

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_picture TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cover_image_url TEXT,
    description TEXT,
    image_url TEXT,
    theme VARCHAR(100),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    total_budget DECIMAL(10,2),
    currency_code VARCHAR(10) DEFAULT 'USD',
    is_public BOOLEAN DEFAULT FALSE,
    is_community BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(255) UNIQUE,
    views_count INTEGER DEFAULT 0,
    weather_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trip collaborators table
CREATE TABLE IF NOT EXISTS trip_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Trip days table
CREATE TABLE IF NOT EXISTS trip_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(255),
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(trip_id, day_number)
);

-- Places table (for trip itinerary places)
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_day_id UUID REFERENCES trip_days(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    time_start TIME,
    time_end TIME,
    notes TEXT,
    image_url TEXT,
    place_type TEXT CHECK (place_type IN ('attraction', 'food', 'hotel', 'transport', 'other')),
    sticker TEXT,
    cost DECIMAL(10,2),
    cost_currency TEXT DEFAULT 'USD',
    budget_category TEXT CHECK (budget_category IN ('accommodation', 'food', 'transport', 'activities', 'shopping', 'misc')),
    transport_mode TEXT CHECK (transport_mode IN ('driving', 'walking', 'transit', 'flight')),
    display_order INTEGER DEFAULT 0,
    travel_time_seconds INTEGER,
    travel_distance_meters INTEGER,
    travel_time_text TEXT,
    travel_distance_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Story items table
CREATE TABLE IF NOT EXISTS story_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL,
    content_url TEXT,
    caption TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Place database (for scraped places data)
CREATE TABLE IF NOT EXISTS place_database (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    place_type VARCHAR(50),
    category VARCHAR(50),
    rating DECIMAL(3, 2),
    review_count INTEGER DEFAULT 0,
    price_level INTEGER,
    opening_hours TEXT,
    contact_info JSONB,
    amenities TEXT[],
    photos TEXT[],
    source VARCHAR(50) NOT NULL,
    source_id VARCHAR(255),
    source_url TEXT,
    popularity_score INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_id, city, country)
);

-- Scraped locations (legacy support)
CREATE TABLE IF NOT EXISTS scraped_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_name TEXT NOT NULL,
    source TEXT NOT NULL,
    visitor_count INTEGER,
    rating DECIMAL(3,2),
    tips TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    cached_at TIMESTAMP DEFAULT NOW(),
    place_type TEXT,
    estimated_cost INTEGER,
    estimated_duration INTEGER,
    budget_category TEXT CHECK (budget_category IN ('low', 'medium', 'high')),
    interest_match DECIMAL(3,2),
    popularity_score DECIMAL(3,2),
    weather_suitability TEXT CHECK (weather_suitability IN ('indoor', 'outdoor', 'flexible')),
    opening_hours TEXT,
    crowd_level TEXT CHECK (crowd_level IN ('low', 'medium', 'high')),
    diversity_score DECIMAL(3,2),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (location_name, source)
);

-- Destination suggestions table
CREATE TABLE IF NOT EXISTS destination_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    continent VARCHAR(50),
    description TEXT,
    image_url TEXT,
    month INTEGER,
    temperature_avg DECIMAL(4,1),
    weather_condition VARCHAR(100),
    why_now TEXT,
    climate_type VARCHAR(100),
    activity_type VARCHAR(100),
    popularity_score INTEGER DEFAULT 0,
    best_time_to_visit VARCHAR(100),
    average_temperature DECIMAL(4,1),
    currency VARCHAR(10),
    language VARCHAR(50),
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(destination_name, country)
);

-- Search queries (analytics)
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    selected_result_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Place interactions (analytics)
CREATE TABLE IF NOT EXISTS place_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    place_id UUID REFERENCES place_database(id) ON DELETE CASCADE NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    interaction_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    preferred_place_types TEXT[],
    budget_preferences JSONB,
    interest_weights JSONB,
    travel_style VARCHAR(50),
    group_preferences JSONB,
    accessibility_needs TEXT[],
    dietary_restrictions TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Place suggestions cache
CREATE TABLE IF NOT EXISTS place_suggestions_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_hash VARCHAR(255) UNIQUE NOT NULL,
    destination VARCHAR(255) NOT NULL,
    interests JSONB,
    budget_level VARCHAR(20),
    group_size INTEGER,
    traveler_types JSONB,
    suggestions_data JSONB NOT NULL,
    search_metadata JSONB,
    cached_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    cache_hit_count INTEGER DEFAULT 0
);

-- Cache statistics
CREATE TABLE IF NOT EXISTS cache_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_type VARCHAR(50) NOT NULL,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    hit_rate DECIMAL(5,2) DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    date DATE NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(cache_type, date)
);

-- Scraping jobs (for Python scraper management)
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    places_scraped INTEGER DEFAULT 0,
    error_message TEXT,
    scheduled_for TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Scraping schedule (for weekly scraping)
CREATE TABLE IF NOT EXISTS scraping_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    frequency VARCHAR(50) DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    last_run TIMESTAMP,
    next_run TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(destination, category)
);

-- Scraping progress (for frontend display of scraping status)
CREATE TABLE IF NOT EXISTS scraping_progress (
    session_id VARCHAR(255) PRIMARY KEY,
    current_destination INTEGER DEFAULT 0,
    total_destinations INTEGER DEFAULT 0,
    current_category INTEGER DEFAULT 0,
    total_categories INTEGER DEFAULT 0,
    places_found INTEGER DEFAULT 0,
    total_places_scraped INTEGER DEFAULT 0,
    current_message TEXT,
    level VARCHAR(20) DEFAULT 'INFO',
    status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    started_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Packing lists
CREATE TABLE IF NOT EXISTS packing_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Packing items
CREATE TABLE IF NOT EXISTS packing_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packing_list_id UUID REFERENCES packing_lists(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    is_packed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Packing templates
CREATE TABLE IF NOT EXISTS packing_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_type VARCHAR(100) NOT NULL,
    weather_condition VARCHAR(100),
    trip_duration_days INTEGER,
    item VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Story likes
CREATE TABLE IF NOT EXISTS story_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Collaborators (legacy - keeping for compatibility)
CREATE TABLE IF NOT EXISTS collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Regeneration memory
CREATE TABLE IF NOT EXISTS regeneration_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    memory_data JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, session_id)
);

-- Analytics events (CRITICAL - missing table causing errors)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens (for JWT authentication)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Suggestion interactions (for destination suggestions analytics)
CREATE TABLE IF NOT EXISTS suggestion_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    suggestion_id UUID REFERENCES destination_suggestions(id) ON DELETE CASCADE NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trip versions (for version control functionality)
CREATE TABLE IF NOT EXISTS trip_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    version_name VARCHAR(255),
    trip_data JSONB NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(trip_id, version_number)
);

-- Budget entries (for budget tracking)
CREATE TABLE IF NOT EXISTS budget_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exchange rates (for currency conversion)
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(10) NOT NULL,
    target_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    cached_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(base_currency, target_currency)
);

-- Trip likes (for community features)
CREATE TABLE IF NOT EXISTS trip_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- User preference interactions (for learning user preferences)
CREATE TABLE IF NOT EXISTS user_preference_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    place_data JSONB,
    context_data JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User customization preferences (for storing user preferences)
CREATE TABLE IF NOT EXISTS user_customization_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    preferences_data JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Place analytics (for tracking place performance)
CREATE TABLE IF NOT EXISTS place_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id UUID REFERENCES place_database(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    additions_count INTEGER DEFAULT 0,
    visits_count INTEGER DEFAULT 0,
    bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(place_id, date)
);

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_trips_owner_id ON trips(owner_id);
CREATE INDEX IF NOT EXISTS idx_trip_days_trip_id ON trip_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_days_date ON trip_days(date);
CREATE INDEX IF NOT EXISTS idx_places_trip_day_id ON places(trip_day_id);
CREATE INDEX IF NOT EXISTS idx_places_display_order ON places(trip_day_id, display_order);

CREATE INDEX IF NOT EXISTS idx_place_database_city_country ON place_database(city, country);
CREATE INDEX IF NOT EXISTS idx_place_database_category ON place_database(category);
CREATE INDEX IF NOT EXISTS idx_place_database_rating ON place_database(rating DESC);
CREATE INDEX IF NOT EXISTS idx_place_database_popularity ON place_database(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_place_database_source ON place_database(source);

CREATE INDEX IF NOT EXISTS idx_scraped_locations_location_name ON scraped_locations(location_name);
CREATE INDEX IF NOT EXISTS idx_scraped_locations_source ON scraped_locations(source);
CREATE INDEX IF NOT EXISTS idx_scraped_locations_rating ON scraped_locations(rating DESC);

CREATE INDEX IF NOT EXISTS idx_destination_suggestions_destination_name ON destination_suggestions(destination_name);
CREATE INDEX IF NOT EXISTS idx_destination_suggestions_country ON destination_suggestions(country);
CREATE INDEX IF NOT EXISTS idx_destination_suggestions_popularity ON destination_suggestions(popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_place_interactions_user_id ON place_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_place_interactions_place_id ON place_interactions(place_id);
CREATE INDEX IF NOT EXISTS idx_place_interactions_type ON place_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_place_suggestions_destination_hash ON place_suggestions_cache(destination_hash);
CREATE INDEX IF NOT EXISTS idx_place_suggestions_expires_at ON place_suggestions_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_scheduled_for ON scraping_jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scraping_schedule_next_run ON scraping_schedule(next_run);

CREATE INDEX IF NOT EXISTS idx_packing_items_list_id ON packing_items(packing_list_id);
CREATE INDEX IF NOT EXISTS idx_stories_trip_id ON stories(trip_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_trip_id ON collaborators(trip_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_trip_id ON analytics_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_user_id ON suggestion_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_suggestion_id ON suggestion_interactions(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_type ON suggestion_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_suggestion_interactions_created_at ON suggestion_interactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trip_versions_trip_id ON trip_versions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_versions_version_number ON trip_versions(trip_id, version_number);
CREATE INDEX IF NOT EXISTS idx_trip_versions_created_by ON trip_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_trip_versions_created_at ON trip_versions(created_at DESC);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_budget_entries_trip_id ON budget_entries(trip_id);
CREATE INDEX IF NOT EXISTS idx_budget_entries_category ON budget_entries(category);
CREATE INDEX IF NOT EXISTS idx_budget_entries_created_at ON budget_entries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_base_target ON exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_cached_at ON exchange_rates(cached_at DESC);

CREATE INDEX IF NOT EXISTS idx_trip_likes_trip_id ON trip_likes(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_likes_user_id ON trip_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_likes_created_at ON trip_likes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_preference_interactions_user_id ON user_preference_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preference_interactions_type ON user_preference_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_preference_interactions_timestamp ON user_preference_interactions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_customization_preferences_user_id ON user_customization_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_customization_preferences_updated ON user_customization_preferences(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_place_analytics_place_id ON place_analytics(place_id);
CREATE INDEX IF NOT EXISTS idx_place_analytics_date ON place_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_place_analytics_place_date ON place_analytics(place_id, date);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_days_updated_at ON trip_days;
CREATE TRIGGER update_trip_days_updated_at BEFORE UPDATE ON trip_days FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_places_updated_at ON places;
CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scraped_locations_updated_at ON scraped_locations;
CREATE TRIGGER update_scraped_locations_updated_at BEFORE UPDATE ON scraped_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_destination_suggestions_updated_at ON destination_suggestions;
CREATE TRIGGER update_destination_suggestions_updated_at BEFORE UPDATE ON destination_suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_packing_lists_updated_at ON packing_lists;
CREATE TRIGGER update_packing_lists_updated_at BEFORE UPDATE ON packing_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_packing_items_updated_at ON packing_items;
CREATE TRIGGER update_packing_items_updated_at BEFORE UPDATE ON packing_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collaborators_updated_at ON collaborators;
CREATE TRIGGER update_collaborators_updated_at BEFORE UPDATE ON collaborators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scraping_jobs_updated_at ON scraping_jobs;
CREATE TRIGGER update_scraping_jobs_updated_at BEFORE UPDATE ON scraping_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scraping_schedule_updated_at ON scraping_schedule;
CREATE TRIGGER update_scraping_schedule_updated_at BEFORE UPDATE ON scraping_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scraping_progress_updated_at ON scraping_progress;
CREATE TRIGGER update_scraping_progress_updated_at BEFORE UPDATE ON scraping_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for new tables
DROP TRIGGER IF EXISTS update_budget_entries_updated_at ON budget_entries;
CREATE TRIGGER update_budget_entries_updated_at BEFORE UPDATE ON budget_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exchange_rates_updated_at ON exchange_rates;
CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_customization_preferences_updated_at ON user_customization_preferences;
CREATE TRIGGER update_user_customization_preferences_updated_at BEFORE UPDATE ON user_customization_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_place_analytics_updated_at ON place_analytics;
CREATE TRIGGER update_place_analytics_updated_at BEFORE UPDATE ON place_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Database functions for access control
CREATE OR REPLACE FUNCTION user_owns_trip(p_user_id UUID, p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips 
        WHERE id = p_trip_id AND owner_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_is_collaborator(p_user_id UUID, p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trip_collaborators 
        WHERE trip_id = p_trip_id AND user_id = p_user_id AND accepted_at IS NOT NULL
    ) OR EXISTS (
        SELECT 1 FROM collaborators 
        WHERE trip_id = p_trip_id AND user_id = p_user_id AND accepted_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trip_is_public(p_trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips 
        WHERE id = p_trip_id AND is_public = true
    );
END;
$$ LANGUAGE plpgsql;