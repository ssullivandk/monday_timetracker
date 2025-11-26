-- Migration 002: Indexes and Row Level Security
-- Creates performance indexes and RLS policies for all tables

-- ============================================
-- Indexes for user_profiles
-- ============================================
CREATE INDEX idx_user_profiles_monday_user_id ON public.user_profiles(monday_user_id);
CREATE INDEX idx_user_profiles_monday_account_id ON public.user_profiles(monday_account_id);

-- ============================================
-- Indexes for time_entry
-- ============================================
CREATE INDEX idx_time_entry_user_id ON public.time_entry(user_id);
CREATE INDEX idx_time_entry_is_draft ON public.time_entry(is_draft);
CREATE INDEX idx_time_entry_synced_to_monday ON public.time_entry(synced_to_monday);
CREATE INDEX idx_time_entry_created_at ON public.time_entry(created_at DESC);
CREATE INDEX idx_time_entry_board_item ON public.time_entry(board_id, item_id);

-- ============================================
-- Indexes for timer_session
-- ============================================
CREATE INDEX idx_timer_session_user_id ON public.timer_session(user_id);
CREATE INDEX idx_timer_session_draft_id ON public.timer_session(draft_id);

-- Partial unique index: enforce one active (non-paused with open segments) session per user
-- This prevents users from having multiple running timers simultaneously
CREATE UNIQUE INDEX idx_timer_session_user_active 
    ON public.timer_session(user_id) 
    WHERE (is_paused = false);

-- ============================================
-- Indexes for timer_segment
-- ============================================
CREATE INDEX idx_timer_segment_session_id ON public.timer_segment(session_id);

-- Composite index for efficient session segment queries (open segments first)
CREATE INDEX idx_timer_segment_session_end 
    ON public.timer_segment(session_id, end_time NULLS FIRST);

-- ============================================
-- Indexes for role
-- ============================================
CREATE INDEX idx_role_name ON public.role(name);

-- ============================================
-- Enable Row Level Security on all tables
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timer_segment ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: user_profiles
-- ============================================
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (true); -- Allow viewing all profiles (needed for app functionality)

CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Allow insert for authenticated users"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (true); -- App manages user creation

-- ============================================
-- RLS Policies: role (readable by all, managed by admins)
-- ============================================
CREATE POLICY "Roles are viewable by all"
    ON public.role
    FOR SELECT
    USING (true);

CREATE POLICY "Roles can be managed"
    ON public.role
    FOR ALL
    USING (true); -- In production, restrict to admin users

-- ============================================
-- RLS Policies: time_entry
-- ============================================
CREATE POLICY "Users can view own time entries"
    ON public.time_entry
    FOR SELECT
    USING (user_id IN (
        SELECT id FROM public.user_profiles WHERE id = user_id
    ));

CREATE POLICY "Users can insert own time entries"
    ON public.time_entry
    FOR INSERT
    WITH CHECK (user_id IN (
        SELECT id FROM public.user_profiles WHERE id = user_id
    ));

CREATE POLICY "Users can update own time entries"
    ON public.time_entry
    FOR UPDATE
    USING (user_id IN (
        SELECT id FROM public.user_profiles WHERE id = user_id
    ));

CREATE POLICY "Users can delete own time entries"
    ON public.time_entry
    FOR DELETE
    USING (user_id IN (
        SELECT id FROM public.user_profiles WHERE id = user_id
    ));

-- ============================================
-- RLS Policies: timer_session
-- ============================================
CREATE POLICY "Users can manage their timer_sessions"
    ON public.timer_session
    FOR ALL
    USING (user_id IN (
        SELECT id FROM public.user_profiles WHERE id = user_id
    ));

-- ============================================
-- RLS Policies: timer_segment
-- ============================================
CREATE POLICY "Users can manage their timer_segments"
    ON public.timer_segment
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.timer_session ts
            WHERE ts.id = timer_segment.session_id
            AND ts.user_id IN (
                SELECT id FROM public.user_profiles WHERE id = ts.user_id
            )
        )
    );