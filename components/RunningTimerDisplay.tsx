// components/RunningTimerDisplay.tsx
import { formatTime } from "@/lib/utils";
import { useTimerStore } from "@/stores/timerStore";
import { useUserStore } from "@/stores/userStore";
import { useMondayContext } from "@/hooks/useMondayContext";
import { useDraftStore } from "@/stores/draftStore";
import { Flex, Text, Button } from "@vibe/core";
import Reset from "@/components/icons/Reset";
import "@/public/css/components/RunningTimerDisplay.css";

export default function RunningTimerDisplay({ ...props }) {
	const { resetTimer, clearComment, sessionId, draftId, isPaused, elapsedTime, isSaving } = useTimerStore.getState();
	const userId = useUserStore.getState().supabaseUser?.id;

	const handleTimerReset = () => {
		resetTimer({ userId, draftId, sessionId });
		clearComment();
	};

	const resetIcon = <Reset fillColor={sessionId ? "var(--color--text-on-primary)" : "var(--color--text-disabled)"} />;

	return (
		<Flex direction="row" align="center" justify="center" className="timer-display" gap="medium" {...props}>
			<Text className={`timer-time${sessionId ? " active" : ""}${isPaused ? " paused" : ""}`} type="text1" weight="bold">
				{formatTime(elapsedTime)}
			</Text>
			<Button className="btn-reset" onClick={handleTimerReset} kind="primary" size="small" ariaLabel="Timer zurücksetzen" disabled={!sessionId || isSaving}>
				{resetIcon}
			</Button>
		</Flex>
	);
}
