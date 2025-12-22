-- ============================================================
-- STRIVEN PROFILES TABLE FIX
-- Run this in your Supabase SQL Editor to fix schema cache errors
-- ============================================================

-- Step 1: Ensure the profiles table has all required columns
-- This will add missing columns without affecting existing data

-- Check if 'striven_score' column exists, add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'striven_score'
    ) THEN
        ALTER TABLE profiles ADD COLUMN striven_score INTEGER DEFAULT 0;
    END IF;
END $$;

-- Check if 'username' column exists, add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE profiles ADD COLUMN username TEXT;
    END IF;
END $$;

-- Check if 'last_sync' column exists, add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_sync'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_sync TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Step 2: Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_striven_score 
ON profiles (striven_score DESC);

-- Step 3: Enable Row Level Security (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create/Replace RLS Policies
-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Profiles Access" ON profiles;
DROP POLICY IF EXISTS "Self Insert" ON profiles;
DROP POLICY IF EXISTS "Self Update" ON profiles;
DROP POLICY IF EXISTS "Public Read" ON profiles;

-- Allow anyone to read profiles (for leaderboard)
CREATE POLICY "Public Read" 
ON profiles FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Self Insert" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Self Update" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Step 5: Refresh the PostgREST schema cache
-- This fixes the "Could not find column in schema cache" error
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the table structure
-- Run this to see your current table schema:
 SELECT column_name, data_type, is_nullable 
 FROM information_schema.columns 
 WHERE table_name = 'profiles';

-- ============================================================
-- OPTIONAL: If you need to create the profiles table from scratch
-- Uncomment the block below only if the table doesn't exist
-- ============================================================


CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    striven_score INTEGER DEFAULT 0,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
*/
