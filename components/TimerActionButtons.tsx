// components/TimerActionButtons.tsx
/**
 * @deprecated This component is deprecated. Use TimerControls from components/TimerControls.tsx instead.
 *
 * This file is kept for backwards compatibility during migration.
 * It wraps the new TimerControls component with the old API.
 */
"use client";

import TimerControls from "@/components/TimerControls";
import type { TimerStatus } from "@/types/timer.types";

interface TimerActionButtonsProps {
	startTimer: () => void;
	pauseTimer: () => void;
	resetTimer: () => void;
	softResetTimer: () => void;
	isPaused: boolean;
	draftId: string | null;
	sessionId: string | null;
	comment: string;
	isSaving: boolean;
	error: string | null;
}

export default function TimerActionButtons({ startTimer, pauseTimer, isPaused, sessionId, isSaving }: TimerActionButtonsProps) {
	// Convert old props to new status-based API
	const status: TimerStatus = !sessionId ? "idle" : isPaused ? "paused" : "running";
	const hasSession = sessionId !== null;

	const handlePlayPause = () => {
		if (status === "idle" || status === "paused") {
			startTimer();
		} else {
			pauseTimer();
		}
	};

	// Note: saveAsDraft and save callbacks need to be provided by the parent
	// This wrapper is for backwards compatibility only
	const handleSaveAsDraft = () => {
		console.warn("TimerActionButtons: saveAsDraft not implemented in wrapper");
	};

	const handleSave = () => {
		console.warn("TimerActionButtons: save not implemented in wrapper");
	};

	return <TimerControls status={status} hasSession={hasSession} isSaving={isSaving} onPlayPause={handlePlayPause} onSaveAsDraft={handleSaveAsDraft} onSave={handleSave} />;
}
