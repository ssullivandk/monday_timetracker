-- Enable UUID extension (for generating user IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: User Profiles (links Monday.com users to Supabase)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monday_user_id TEXT NOT NULL UNIQUE, -- Monday.com user ID
    monday_account_id TEXT NOT NULL, -- Monday.com account ID
    email TEXT,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: Time Entries
CREATE TABLE public.time_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    task_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL, -- Duration in seconds
    board_id TEXT,
    item_id TEXT,
    role TEXT,
    is_draft BOOLEAN NOT NULL DEFAULT true,
    comment TEXT,
    synced_to_monday BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: end_time must be after start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    -- Constraint: duration must be positive
    CONSTRAINT valid_duration CHECK (duration > 0)
);

-- Indexes for fast queries
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_created_at ON public.time_entries(created_at);
CREATE INDEX idx_time_entries_is_draft ON public.time_entries(is_draft);
CREATE INDEX idx_time_entries_synced_to_monday ON public.time_entries(synced_to_monday);
CREATE INDEX idx_user_profiles_monday_user_id ON public.user_profiles(monday_user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on time_entries
CREATE TRIGGER update_time_entries_updated_at
    BEFORE UPDATE ON public.time_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own data
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own time entries"
    ON public.time_entries
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"
    ON public.time_entries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"
    ON public.time_entries
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries"
    ON public.time_entries
    FOR DELETE
    USING (auth.uid() = user_id);