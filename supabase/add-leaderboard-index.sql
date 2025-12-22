-- Speed up leaderboard queries with an index
-- Run this in Supabase SQL Editor

-- Create index on striven_score for faster ORDER BY queries
CREATE INDEX IF NOT EXISTS idx_profiles_striven_score 
ON profiles (striven_score DESC);

-- Optional: Create a composite index if you filter by other columns
-- CREATE INDEX IF NOT EXISTS idx_profiles_score_username 
-- ON profiles (striven_score DESC, username);

-- Verify the index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles';
