-- Migration 001: Initial Schema
-- Creates core tables: user_profiles, role, time_entry, timer_session, timer_segment
-- Schema matches types/database.ts
-- IMPORTANT: All timestamps use database server time (NOW()) to avoid clock drift issues

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: user_profiles
-- Links Monday.com users to Supabase
-- ============================================
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monday_user_id TEXT NOT NULL UNIQUE,
    monday_account_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: role
-- Stores available roles for time entries
-- ============================================
CREATE TABLE public.role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: time_entry
-- Stores time tracking entries (both drafts and finalized)
-- ============================================
CREATE TABLE public.time_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    task_name TEXT,
    start_time TIMESTAMPTZ DEFAULT NOW(), -- Uses DB server time for consistency
    end_time TIMESTAMPTZ,
    duration INTEGER, -- Duration in seconds
    board_id TEXT,
    item_id TEXT,
    role TEXT,
    comment TEXT,
    is_draft BOOLEAN NOT NULL DEFAULT TRUE,
    synced_to_monday BOOLEAN NOT NULL DEFAULT FALSE,
    timer_session JSONB, -- Denormalized session data for history
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: timer_session
-- Tracks active timer sessions for users
-- ============================================
CREATE TABLE public.timer_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES public.time_entry(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Uses DB server time for consistency
    elapsed_time INTEGER NOT NULL DEFAULT 0, -- Elapsed time in milliseconds
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,
    timer_segments JSONB, -- Denormalized segments for quick access
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: timer_segment
-- Individual running segments within a timer session
-- ============================================
CREATE TABLE public.timer_segment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.timer_session(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Uses DB server time for consistency
    end_time TIMESTAMPTZ,
    duration INTEGER, -- Duration in milliseconds (computed on end)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Trigger function: Auto-update updated_at column
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_updated_at
    BEFORE UPDATE ON public.role
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entry_updated_at
    BEFORE UPDATE ON public.time_entry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timer_session_updated_at
    BEFORE UPDATE ON public.timer_session
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();