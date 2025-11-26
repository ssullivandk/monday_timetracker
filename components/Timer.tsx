// components/Timer.tsx
"use client";

import { Box, Flex } from "@vibe/core";
import { useTimer } from "@/hooks/useTimer";
import { useModalStore } from "@/stores/modalStore";
import TimerDisplay from "@/components/TimerDisplay";
import TimerControls from "@/components/TimerControls";
import TimerCommentField from "@/components/TimerCommentField";
import SaveTimerModal from "@/components/dashboard/SaveTimerModal";

/**
 * Timer - Container component for the timer feature
 *
 * This is the smart container component that:
 * - Uses the useTimer hook to access all timer logic
 * - Passes data and callbacks down to presentational children
 * - Manages the save modal visibility
 *
 * Following Container/Presentational pattern:
 * - This component owns ALL the logic
 * - Child components are pure and receive props only
 */
export default function Timer() {
	// Get all timer state and actions from the unified hook
	const { state, actions, isActive, hasSession } = useTimer();

	// Modal state
	const { showTimerSave, closeTimerSave } = useModalStore();

	// Determine play/pause action based on current status
	const handlePlayPause = () => {
		if (state.status === "idle" || state.status === "paused") {
			actions.start();
		} else {
			actions.pause();
		}
	};

	return (
		<Box className="timer-container" padding="large">
			<Flex direction="row" align="stretch" gap={32}>
				<Flex direction="row" align="center" justify="center" gap={16}>
					{/* Timer Display - shows elapsed time and reset button */}
					<TimerDisplay elapsedTime={state.elapsedTime} status={state.status} onReset={actions.reset} disabled={!hasSession || state.isSaving} />

					{/* Timer Controls - play/pause, save as draft, save buttons */}
					<TimerControls status={state.status} hasSession={hasSession} isSaving={state.isSaving} onPlayPause={handlePlayPause} onSaveAsDraft={actions.saveAsDraft} onSave={actions.openSaveModal} />
				</Flex>

				{/* Comment Field */}
				<TimerCommentField value={state.comment} onChange={actions.updateComment} disabled={!hasSession} />
			</Flex>

			{/* Save Timer Modal */}
			<SaveTimerModal show={showTimerSave} onClose={closeTimerSave} />
		</Box>
	);
}
