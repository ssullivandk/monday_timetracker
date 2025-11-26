-- Migration 005: Add get_current_elapsed_time function
-- Calculates elapsed time entirely on the database server to avoid clock drift
-- between the app server/browser and the database server

-- ============================================
-- Function: get_current_elapsed_time
-- Returns the current elapsed time for a session in milliseconds
-- Uses database NOW() for all calculations to ensure consistency
-- ============================================
CREATE OR REPLACE FUNCTION get_current_elapsed_time(p_session_id UUID)
RETURNS jsonb AS $$
DECLARE
    v_session timer_session;
    v_current_segment_duration BIGINT;
    v_total_elapsed BIGINT;
    v_server_time TIMESTAMPTZ;
BEGIN
    -- Get current database server time
    v_server_time := NOW();
    
    -- Fetch the session
    SELECT * INTO v_session
    FROM timer_session
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'elapsed_time_ms', 0,
            'server_time', v_server_time,
            'error', 'Session not found'
        );
    END IF;
    
    -- Start with the stored elapsed time
    v_total_elapsed := v_session.elapsed_time;
    
    -- If session is running (not paused), add time from current open segment
    IF NOT v_session.is_paused THEN
        SELECT COALESCE(
            EXTRACT(EPOCH FROM (v_server_time - seg.start_time)) * 1000,
            0
        )::BIGINT INTO v_current_segment_duration
        FROM timer_segment seg
        WHERE seg.session_id = p_session_id
            AND seg.end_time IS NULL
        ORDER BY seg.start_time DESC
        LIMIT 1;
        
        -- Add current segment duration (if any)
        v_total_elapsed := v_total_elapsed + COALESCE(v_current_segment_duration, 0);
    END IF;
    
    RETURN jsonb_build_object(
        'elapsed_time_ms', v_total_elapsed,
        'server_time', v_server_time,
        'is_paused', v_session.is_paused,
        'stored_elapsed_time_ms', v_session.elapsed_time
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Function: get_timer_session_with_elapsed
-- Returns a complete session with calculated elapsed time
-- Useful for the session API endpoint
-- ============================================
CREATE OR REPLACE FUNCTION get_timer_session_with_elapsed(p_user_id UUID)
RETURNS jsonb AS $$
DECLARE
    v_session timer_session;
    v_time_entry time_entry;
    v_current_segment_duration BIGINT;
    v_total_elapsed BIGINT;
    v_server_time TIMESTAMPTZ;
BEGIN
    -- Get current database server time
    v_server_time := NOW();
    
    -- Fetch the session for this user
    SELECT * INTO v_session
    FROM timer_session
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'session', NULL,
            'server_time', v_server_time
        );
    END IF;
    
    -- Fetch the associated time entry (draft)
    SELECT * INTO v_time_entry
    FROM time_entry
    WHERE id = v_session.draft_id;
    
    -- Start with the stored elapsed time
    v_total_elapsed := v_session.elapsed_time;
    
    -- If session is running (not paused), add time from current open segment
    IF NOT v_session.is_paused THEN
        SELECT COALESCE(
            EXTRACT(EPOCH FROM (v_server_time - seg.start_time)) * 1000,
            0
        )::BIGINT INTO v_current_segment_duration
        FROM timer_segment seg
        WHERE seg.session_id = v_session.id
            AND seg.end_time IS NULL
        ORDER BY seg.start_time DESC
        LIMIT 1;
        
        -- Add current segment duration (if any)
        v_total_elapsed := v_total_elapsed + COALESCE(v_current_segment_duration, 0);
    END IF;
    
    RETURN jsonb_build_object(
        'session', jsonb_build_object(
            'id', v_session.id,
            'user_id', v_session.user_id,
            'draft_id', v_session.draft_id,
            'start_time', v_session.start_time,
            'elapsed_time', v_session.elapsed_time,
            'is_paused', v_session.is_paused,
            'created_at', v_session.created_at,
            'time_entry', CASE 
                WHEN v_time_entry IS NOT NULL THEN jsonb_build_object(
                    'id', v_time_entry.id,
                    'comment', v_time_entry.comment
                )
                ELSE NULL
            END
        ),
        'calculated_elapsed_time_ms', v_total_elapsed,
        'server_time', v_server_time
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;