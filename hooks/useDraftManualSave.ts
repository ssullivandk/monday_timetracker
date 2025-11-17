"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { useTimerState } from "./useTimerState";

type TimerSession = Database["public"]["Tables"]["timer_session"]["Row"];
type TimerSegment = Database["public"]["Tables"]["timer_segment"]["Row"];

export function useDraftManualSave(comment: string) {
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [taskName, setTaskName] = useState("");
	const [timerSession, setTimerSession] = useState<TimerSession | null>(null);
	const [timerSegments, setTimerSegments] = useState<TimerSegment[] | null>(null);

	// Set task_name as comment if not provided
	useEffect(() => {
		if (!taskName && comment.trim()) {
			setTaskName(comment);
		} else if (!comment.trim()) {
			setTaskName("Ungespeicherter Zeiteintrag");
		}
	}, [comment, taskName]);

	// Fetch timer_segments
	const fetchTimerSegments = async (sessionId: string | null) => {
		if (!timerSession) return;
		try {
			const { data, error } = await supabase.from("timer_segment").select("*");

			if (data) {
				setTimerSegments(data);
			}

			if (error) {
				console.error("Error fetching timer segments:", error);
			}
		} catch (error) {
			console.error("Error fetching timer segments:", error);
		}
	};

	// Fetch timer_session
	const fetchTimerSession = async (timeEntryId: string) => {
		try {
			const { data } = await supabase.from("timer_session").select("*").eq("draft_id", timeEntryId).single();

			if (data.id) {
				setTimerSession(data);
			}
		} catch (error) {
			console.error("Error fetching timer session:", error);
		}
	};

	// Save segments to session
	const saveSegmentsToSession = async () => {
		if (!timerSession || !timerSegments) return;

		try {
			if (timerSession.id && timerSegments.length > 0) {
				let newTimerSession = timerSession;
				newTimerSession!.timer_segments = timerSegments;
				setTimerSession(newTimerSession);
			}
		} catch (error) {
			console.error("Error saving segments to session:", error);
		}
	};

	const saveDraft = async (timeEntryId: string, sessionId: string | null) => {
		setIsSaving(true);
		setError(null);

		await fetchTimerSegments(sessionId);
		await fetchTimerSession(timeEntryId);
		await saveSegmentsToSession();

		const endTime = new Date().toISOString();

		try {
			await supabase
				.from("time_entry")
				.update({
					task_name: taskName,
					end_time: endTime,
					comment,
					duration: timerSession.elapsed_time ? timerSession.elapsed_time : null,
					timer_sessions: timerSession ? timerSession : null,
					is_draft: true,
				})
				.eq("id", timeEntryId);
			console.log("Draft saved successfully.");
		} catch (err) {
			console.error("Error saving draft:", err);
			setError("Failed to save draft. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	return { saveDraft, isSaving, error, taskName, setTaskName };
}

const useDraftCache = () => {
	const [cache, setCache] = useState<Map<string, any>>(new Map());

	const getCachedDraft = (userId: string) => cache.get(`draft_${userId}`);
	const setCachedDraft = (userId: string, draft: any) => {
		setCache((prev) => new Map(prev).set(`draft_${userId}`, draft));
	};

	return { getCachedDraft, setCachedDraft };
};

/**
 *
 * 1. Fetch timer_session by draft_id
 * 2. Fetch timer_segments by session_id
 * 3. Save timer_segments to timer_session
 * 4. Update time_entry with new data
 * 5. Delete timer_session
 * 6. Handle loading and error states
 *
 */
