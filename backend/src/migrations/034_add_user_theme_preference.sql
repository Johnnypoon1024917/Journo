-- Migration: Add user theme preference
-- Description: Adds theme_color column to users table for personal theme preferences

-- Add theme_color column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7) DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_theme_color ON users(theme_color);

-- Add comment
COMMENT ON COLUMN users.theme_color IS 'User preferred primary theme color in hex format (#RRGGBB)';
