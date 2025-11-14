import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useMondayContext } from "@/hooks/useMondayContext";
import { useCommentFieldState } from "@/hooks/useCommentFieldState";
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

console.log("useTimerState hook loaded");

export function useTimerState() {
	const { userProfile } = useMondayContext();
	const { setComment } = useCommentFieldState();
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

				console.log("Loading timer session for user:", userProfile.id);

				// Fetch active or paused session for the user
				const { data: session, error: sessionError } = await supabase
					.from("timer_session")
					.select(
						`
					*,
						time_entry!draft_id (
						comment
					)
      					`
					)
					.eq("user_id", userProfile.id)
					.or("is_running.eq.true,is_paused.eq.true")
					.single();

				console.log("Fetched timer session:", session);

				if (sessionError && sessionError.code !== "PGRST116") {
					throw sessionError;
				}

				if (session) {
					let calculatedElapsedTime = session.elapsed_time;

					// If timer is currently running, calculate real elapsed time
					if (session.is_running && !session.is_paused) {
						// Find the current running segment's start time
						const { data: currentSegment } = await supabase.from("timer_segment").select("start_time").eq("session_id", session.id).eq("is_running", true).is("end_time", null).order("start_time", { ascending: false }).limit(1).single();

						if (currentSegment) {
							const segmentStartTime = new Date(currentSegment.start_time).getTime();
							const now = Date.now();
							const additionalTime = now - segmentStartTime;

							calculatedElapsedTime = session.elapsed_time + additionalTime;
							console.log("Calculated elapsed time:", calculatedElapsedTime, "ms");
						}
					}

					setState({
						isRunning: session.is_running,
						elapsedTime: calculatedElapsedTime,
						startTime: session.start_time,
						isPaused: session.is_paused,
						draftId: session.draft_id,
						sessionId: session.id,
					});

					// Set the comment from the existing draft
					if (session.time_entry?.comment) {
						setComment(session.time_entry.comment);
					}

					console.log("Loaded timer session with comment:", session.time_entry?.comment);
				} else {
					// No active session
					setState({
						isRunning: false,
						elapsedTime: 0,
						startTime: null,
						isPaused: false,
						draftId: null,
						sessionId: null,
					});
					// Clear comment for new session
					setComment("");
				}
			} catch (err: any) {
				console.error("Failed to load timer session:", err);
				setError(err.message || "Failed to load timer session");
				setLoading(false);
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
				},
				async (payload) => {
					// Comprehensive event filtering
					const shouldProcess = (() => {
						switch (payload.eventType) {
							case "INSERT":
							case "UPDATE":
								return payload.new?.user_id === userProfile.id;

							case "DELETE":
								console.log("DELETE event payload:", payload);
								console.log("Current session ID:", state.sessionId);
								// For DELETE events, check if this was our active session
								return payload.old?.id === state.sessionId;

							default:
								return false;
						}
					})();

					if (!shouldProcess) {
						console.log(`🔇 Ignoring ${payload.eventType} event:`, {
							eventType: payload.eventType,
							userId: payload.new?.user_id || payload.old?.user_id,
							sessionId: payload.new?.id || payload.old?.id,
							currentUser: userProfile.id,
							currentSession: state.sessionId,
						});
						return;
					}

					console.log(`🎯 Processing ${payload.eventType} event:`, {
						eventType: payload.eventType,
						data: payload.new || payload.old,
					});

					if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
						const newData = payload.new as TimerSession;

						let calculatedElapsedTime = newData.elapsed_time;

						// Recalculate for running timers
						if (newData.is_running && !newData.is_paused) {
							const { data: currentSegment } = await supabase.from("timer_segment").select("start_time").eq("session_id", newData.id).eq("is_running", true).is("end_time", null).order("start_time", { ascending: false }).limit(1).single();

							if (currentSegment) {
								const segmentStartTime = new Date(currentSegment.start_time).getTime();
								calculatedElapsedTime = newData.elapsed_time + (Date.now() - segmentStartTime);
							}
						}

						setState({
							isRunning: newData.is_running,
							elapsedTime: calculatedElapsedTime,
							startTime: newData.start_time,
							isPaused: newData.is_paused,
							draftId: newData.draft_id,
							sessionId: newData.id,
						});
					} else if (payload.eventType === "DELETE") {
						// Reset state when our session is deleted
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
			.subscribe((status) => {
				console.log("📡 Timer sessions subscription status:", status);
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userProfile, state.sessionId]);

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

	// Cleanup orphaned sessions on mount
	const cleanupOrphanedSessions = useCallback(async () => {
		if (!userProfile) return;

		// Find and clean up any sessions that shouldn't be running
		// This is a safety measure in case of bugs
		const { data: runningSessions } = await supabase.from("timer_session").select("id").eq("user_id", userProfile.id).eq("is_running", true);

		if (runningSessions && runningSessions.length > 1) {
			console.warn("Multiple running sessions found, cleaning up");
			// Keep the most recent one, delete others
			const sorted = runningSessions.sort((a, b) => a.id.localeCompare(b.id));
			const toDelete = sorted.slice(0, -1);

			for (const session of toDelete) {
				await supabase.from("timer_session").delete().eq("id", session.id);
			}
		}
	}, [userProfile]);

	// Start timer: Create draft time_entry and timer_session
	const startTimer = useCallback(async () => {
		if (!userProfile || state.isRunning || state.isPaused || state.sessionId) return;

		try {
			setError(null);

			// Optional: Clean up any orphaned sessions first
			await cleanupOrphanedSessions();

			// Check for existing running session
			const { data: existingSession } = await supabase.from("timer_session").select("*").eq("user_id", userProfile.id).eq("is_running", true).single();

			if (existingSession) {
				// Resume existing session instead of creating new one
				console.log("Resuming existing timer session");

				// Calculate current elapsed time
				let calculatedElapsedTime = existingSession.elapsed_time;
				if (!existingSession.is_paused) {
					const { data: currentSegment } = await supabase.from("timer_segment").select("start_time").eq("session_id", existingSession.id).eq("is_running", true).is("end_time", null).order("start_time", { ascending: false }).limit(1).single();

					if (currentSegment) {
						const segmentStartTime = new Date(currentSegment.start_time).getTime();
						calculatedElapsedTime = existingSession.elapsed_time + (Date.now() - segmentStartTime);
					}
				}

				setState({
					isRunning: true,
					elapsedTime: calculatedElapsedTime,
					startTime: existingSession.start_time,
					isPaused: false,
					draftId: existingSession.draft_id,
					sessionId: existingSession.id,
				});
				return;
			}

			// No existing running session, create new one
			console.log("Creating new timer session");

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
			const { error: segmentError } = await supabase.from("timer_segment").insert({
				session_id: session.id,
				start_time: optimisticStartTime,
				is_running: true,
			});

			if (segmentError) throw segmentError;

			console.log("Started new timer session with ID:", session.id);

			// Update state with actual IDs
			setState((prev) => ({
				...prev,
				draftId: draft.id,
				sessionId: session.id,
			}));
		} catch (err: any) {
			console.error("Failed to start timer:", err);
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
	}, [userProfile, state.isRunning, state.isPaused, state.sessionId, cleanupOrphanedSessions]);

	// Pause/Resume timer: Toggle pause state and update segments
	const pauseTimer = useCallback(async () => {
		console.log("pauseTimer called", {
			isRunning: state.isRunning,
			isPaused: state.isPaused,
			sessionId: state.sessionId,
		});

		if (!userProfile || !state.sessionId || (!state.isRunning && !state.isPaused)) {
			console.log("pauseTimer guard failed");
			return;
		}

		const now = new Date().toISOString();
		const isPausing = state.isRunning && !state.isPaused;

		console.log("isPausing:", isPausing);

		try {
			setError(null);
			const now = new Date().toISOString();
			const isPausing = state.isRunning && !state.isPaused;

			console.log("isPausing:", isPausing);

			// Optimistic update
			setState((prev) => ({
				...prev,
				isPaused: isPausing ? true : false,
			}));

			if (isPausing) {
				// End current running segment
				const { error: endError } = await supabase.from("timer_segment").update({ end_time: now }).eq("session_id", state.sessionId).is("end_time", null).eq("is_running", true);

				if (endError) throw endError;

				// Create pause segment
				const { error: pauseError } = await supabase.from("timer_segment").insert({
					session_id: state.sessionId,
					start_time: now,
					is_pause: true,
				});

				if (pauseError) throw pauseError;
			} else {
				// End current pause segment
				const { error: endPauseError } = await supabase.from("timer_segment").update({ end_time: now }).eq("session_id", state.sessionId).is("end_time", null).eq("is_pause", true);

				if (endPauseError) throw endPauseError;

				// Create running segment
				const { error: resumeError } = await supabase.from("timer_segment").insert({
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
					is_paused: isPausing,
					elapsed_time: state.elapsedTime,
				})
				.eq("id", state.sessionId);

			if (sessionError) throw sessionError;

			console.log("pauseTimer completed successfully");
		} catch (err: any) {
			console.error("pauseTimer failed:", err);
			// Rollback on error
			setState((prev) => ({
				...prev,
				isPaused: state.isPaused,
			}));
			setError(err.message || "Failed to toggle timer");
		}
	}, [userProfile, state.sessionId, state.isRunning, state.isPaused, state.elapsedTime]);

	// Reset timer: Delete draft and session
	const resetTimer = useCallback(async () => {
		console.log("Reset timer called");
		console.log("Current draft ID:", state.draftId);
		console.log("Current session ID:", state.sessionId);
		console.log("Current userId:", userProfile?.id);
		if (!userProfile || !state.draftId || !state.sessionId) return;

		try {
			setError(null);

			const draftIdTemp = state.draftId;
			const sessionIdTemp = state.sessionId;

			// Optimistic update
			setState({
				isRunning: false,
				elapsedTime: 0,
				startTime: null,
				isPaused: false,
				draftId: null,
				sessionId: null,
			});

			console.log("Resetting timer, deleting session ID:", sessionIdTemp);

			// Delete timer_session first (cascades to timer_segments)
			const { error: sessionError } = await supabase.from("timer_session").delete().eq("id", sessionIdTemp);

			if (sessionError) throw sessionError;

			console.log("Resetting timer, deleting draft ID:", draftIdTemp);

			// Then delete draft time_entry
			const { error: draftError } = await supabase.from("time_entry").delete().eq("id", draftIdTemp);

			if (draftError) throw draftError;
		} catch (err: any) {
			console.error("Failed to reset timer:", err);
			// Rollback on error (reload from DB)
			if (userProfile) {
				const { data } = await supabase.from("timer_session").select("*").eq("user_id", userProfile.id).or("is_running.eq.true,is_paused.eq.true").single();

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
	}, [userProfile, state.draftId, state.sessionId]);

	return {
		...state,
		loading,
		error,
		startTimer,
		pauseTimer,
		resetTimer,
	};
}
