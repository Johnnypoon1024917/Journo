-- Add language preference column to users table
-- This allows users to save their preferred language across sessions

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'zh-TW';

-- Add comment for documentation
COMMENT ON COLUMN users.language IS 'User preferred language (en, zh-TW, zh-CN, ja)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_language ON users(language);
