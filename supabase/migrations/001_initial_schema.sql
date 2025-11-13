-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id BIGSERIAL PRIMARY KEY,
  task_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  board_id TEXT,
  item_id TEXT,
  role TEXT,
  is_draft BOOLEAN DEFAULT FALSE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_time_entries_created_at ON time_entries(created_at DESC);
CREATE INDEX idx_time_entries_is_draft ON time_entries(is_draft);
CREATE INDEX idx_time_entries_board_item ON time_entries(board_id, item_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO time_entries (task_name, start_time, end_time, duration, is_draft, comment) VALUES
  ('Setup development environment', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 3600000, false, 'Initial setup'),
  ('Draft task', NOW() - INTERVAL '30 minutes', NOW(), 1800000, true, 'Working on something');