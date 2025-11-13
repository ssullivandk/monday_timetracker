-- Add after the existing table creation and indexes

-- Partial unique index to enforce one active (running) session per user
CREATE UNIQUE INDEX idx_timer_session_user_active ON timer_session (user_id) WHERE (is_running = true);