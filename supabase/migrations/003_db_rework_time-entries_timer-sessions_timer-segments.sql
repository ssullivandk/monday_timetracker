-- Migration to create timer-related tables: time_entry, timer_session, timer_segment
-- Assumes user_profiles table exists with id (uuid) as primary key

-- Create time_entry table
CREATE TABLE time_entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT,
  is_draft BOOLEAN NOT NULL DEFAULT TRUE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  board_id TEXT,
  item_id TEXT,
  role TEXT,
  comment TEXT,
  duration INTEGER, -- in milliseconds
  timer_sessions JSONB, -- optional denormalized data
  synced_to_monday BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create timer_session table
CREATE TABLE timer_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES time_entry(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  elapsed_time INTEGER NOT NULL DEFAULT 0, -- in milliseconds
  is_running BOOLEAN NOT NULL DEFAULT FALSE,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  timer_segments JSONB, -- optional denormalized data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create timer_segment table
CREATE TABLE timer_segment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES timer_session(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_running BOOLEAN NOT NULL DEFAULT FALSE,
  is_pause BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_time_entry_user_id ON time_entry(user_id);
CREATE INDEX idx_time_entry_is_draft ON time_entry(is_draft);
CREATE INDEX idx_timer_session_user_id ON timer_session(user_id);
CREATE INDEX idx_timer_session_draft_id ON timer_session(draft_id);
CREATE INDEX idx_timer_segment_session_id ON timer_segment(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE time_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_segment ENABLE ROW LEVEL SECURITY;

-- RLS Policies (assuming auth via user_profiles; adjust if using Supabase auth)
-- Example: Users can only access their own records
CREATE POLICY "Users can manage their time_entries" ON time_entry
  FOR ALL USING (auth.uid()::text = user_id::text); -- Adjust if user_id is UUID
CREATE POLICY "Users can manage their timer_sessions" ON timer_session
  FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their timer_segments" ON timer_segment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM timer_session
      WHERE timer_session.id = timer_segment.session_id
      AND timer_session.user_id::text = auth.uid()::text
    )
  );

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_entry_updated_at BEFORE UPDATE ON time_entry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timer_session_updated_at BEFORE UPDATE ON timer_session
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();