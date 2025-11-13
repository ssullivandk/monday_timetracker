import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useMondayContext } from "@/hooks/useMondayContext";
import type { Database } from "@/types/database";

type TimerSession = Database["public"]["Tables"]["timer_session"]["Row"];

interface TimerState {
  isRunning: boolean;
  elapsedTime: number;
  startTime: string | null;
  isPaused: boolean;
  draftId: string | null;
  sessionId: string | null;
}

export function useTimerState() {
  const { userProfile } = useMondayContext();
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    elapsedTime: 0,
    startTime: null,
    isPaused: false,
    draftId: null,
    sessionId: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load current timer session on mount or user change
  useEffect(() => {
    if (!userProfile) {
      setLoading(false);
      return;
    }

    const loadTimerSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch active or paused session for the user
        const { data: session, error: sessionError } = await supabase
          .from("timer_session")
          .select("*")
          .eq("user_id", userProfile.id)
          .or("is_running.eq.true,is_paused.eq.true")
          .single();

        if (sessionError && sessionError.code !== "PGRST116") {
          throw sessionError;
        }

        if (session) {
          setState({
            isRunning: session.is_running,
            elapsedTime: session.elapsed_time,
            startTime: session.start_time,
            isPaused: session.is_paused,
            draftId: session.draft_id,
            sessionId: session.id,
          });
        } else {
          // No active session, reset to default
          setState({
            isRunning: false,
            elapsedTime: 0,
            startTime: null,
            isPaused: false,
            draftId: null,
            sessionId: null,
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load timer session");
      } finally {
        setLoading(false);
      }
    };

    loadTimerSession();
  }, [userProfile]);

  // Real-time subscription for cross-device sync
  useEffect(() => {
    if (!userProfile) return;

    const channel = supabase
      .channel("timer_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "timer_session",
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newData = payload.new as TimerSession;
            // Conflict resolution: Always accept the latest database state
            setState({
              isRunning: newData.is_running,
              elapsedTime: newData.elapsed_time,
              startTime: newData.start_time,
              isPaused: newData.is_paused,
              draftId: newData.draft_id,
              sessionId: newData.id,
            });
          } else if (payload.eventType === "DELETE") {
            // Reset state if session is deleted
            setState({
              isRunning: false,
              elapsedTime: 0,
              startTime: null,
              isPaused: false,
              draftId: null,
              sessionId: null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile]);

  // Timer interval for counting elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.isRunning && !state.isPaused) {
      interval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1000,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.isRunning, state.isPaused]);

  // Start timer: Create draft time_entry and timer_session
  const startTimer = useCallback(async () => {
    if (!userProfile || state.isRunning) return;

    try {
      setError(null);

      // Optimistic update
      const optimisticStartTime = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        isRunning: true,
        elapsedTime: 0,
        startTime: optimisticStartTime,
        isPaused: false,
      }));

      // Create draft time_entry
      const { data: draft, error: draftError } = await supabase
        .from("time_entry")
        .insert({
          user_id: userProfile.id,
          is_draft: true,
          start_time: optimisticStartTime,
        })
        .select()
        .single();

      if (draftError) throw draftError;

      // Create timer_session
      const { data: session, error: sessionError } = await supabase
        .from("timer_session")
        .insert({
          user_id: userProfile.id,
          draft_id: draft.id,
          start_time: optimisticStartTime,
          is_running: true,
          elapsed_time: 0,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create initial running timer_segment
      const { error: segmentError } = await supabase
        .from("timer_segment")
        .insert({
          session_id: session.id,
          start_time: optimisticStartTime,
          is_running: true,
        });

      if (segmentError) throw segmentError;

      // Update state with actual IDs
      setState((prev) => ({
        ...prev,
        draftId: draft.id,
        sessionId: session.id,
      }));
    } catch (err: any) {
      // Rollback on error
      setState((prev) => ({
        ...prev,
        isRunning: false,
        elapsedTime: 0,
        startTime: null,
        isPaused: false,
        draftId: null,
        sessionId: null,
      }));
      setError(err.message || "Failed to start timer");
    }
  }, [userProfile, state.isRunning]);

  // Pause/Resume timer: Toggle pause state and update segments
  const pauseTimer = useCallback(async () => {
    if (!userProfile || !state.sessionId || !state.isRunning && !state.isPaused) return;

    try {
      setError(null);

      const now = new Date().toISOString();
      const isPausing = state.isRunning && !state.isPaused;

      // Optimistic update
      setState((prev) => ({
        ...prev,
        isRunning: isPausing ? false : true,
        isPaused: isPausing ? true : false,
      }));

      if (isPausing) {
        // End current running segment
        const { error: endError } = await supabase
          .from("timer_segment")
          .update({ end_time: now })
          .eq("session_id", state.sessionId)
          .is("end_time", null)
          .eq("is_running", true);

        if (endError) throw endError;

        // Create pause segment
        const { error: pauseError } = await supabase
          .from("timer_segment")
          .insert({
            session_id: state.sessionId,
            start_time: now,
            is_pause: true,
          });

        if (pauseError) throw pauseError;
      } else {
        // End current pause segment
        const { error: endPauseError } = await supabase
          .from("timer_segment")
          .update({ end_time: now })
          .eq("session_id", state.sessionId)
          .is("end_time", null)
          .eq("is_pause", true);

        if (endPauseError) throw endPauseError;

        // Create running segment
        const { error: resumeError } = await supabase
          .from("timer_segment")
          .insert({
            session_id: state.sessionId,
            start_time: now,
            is_running: true,
          });

        if (resumeError) throw resumeError;
      }

      // Update session
      const { error: sessionError } = await supabase
        .from("timer_session")
        .update({
          is_running: !isPausing,
          is_paused: isPausing,
          elapsed_time: state.elapsedTime,
        })
        .eq("id", state.sessionId);

      if (sessionError) throw sessionError;
    } catch (err: any) {
      // Rollback on error
      setState((prev) => ({
        ...prev,
        isRunning: state.isRunning,
        isPaused: state.isPaused,
      }));
      setError(err.message || "Failed to toggle timer");
    }
  }, [userProfile, state.sessionId, state.isRunning, state.isPaused, state.elapsedTime]);

  // Reset timer: Delete draft and session
  const resetTimer = useCallback(async () => {
    if (!userProfile || !state.draftId) return;

    try {
      setError(null);

      // Optimistic update
      setState({
        isRunning: false,
        elapsedTime: 0,
        startTime: null,
        isPaused: false,
        draftId: null,
        sessionId: null,
      });

      // Delete draft time_entry (cascades to session and segments)
      const { error } = await supabase
        .from("time_entry")
        .delete()
        .eq("id", state.draftId);

      if (error) throw error;
    } catch (err: any) {
      // Rollback on error (reload from DB)
      if (userProfile) {
        const { data } = await supabase
          .from("timer_session")
          .select("*")
          .eq("user_id", userProfile.id)
          .or("is_running.eq.true,is_paused.eq.true")
          .single();

        if (data) {
          setState({
            isRunning: data.is_running,
            elapsedTime: data.elapsed_time,
            startTime: data.start_time,
            isPaused: data.is_paused,
            draftId: data.draft_id,
            sessionId: data.id,
          });
        }
      }
      setError(err.message || "Failed to reset timer");
    }
  }, [userProfile, state.draftId]);

  return {
    ...state,
    loading,
    error,
    startTimer,
    pauseTimer,
    resetTimer,
  };
}