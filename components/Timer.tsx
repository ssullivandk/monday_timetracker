// components/Timer.tsx
"use client";

import { Box, Flex } from "@vibe/core";
import { useTimerStore } from "@/stores/timerStore";
import { useDraftStore } from "@/stores/draftStore";
import { useUserStore } from "@/stores/userStore";
import { useTimerStateSSR } from "@/hooks/useTimerState";
import { useToast } from "./ToastProvider";
import RunningTimerDisplay from "@/components/RunningTimerDisplay";
import TimerActionButtons from "@/components/TimerActionButtons";
import TimerCommentField from "@/components/TimerCommentField";

export default function Timer({ ...props }) {
	const { elapsedTime, startTimer, pauseTimer, resetTimer, softResetTimer, isPaused, draftId, sessionId, comment, isSaving, error } = useTimerStateSSR();
	const { showToast } = useToast();
	const { saveDraft } = useDraftStore();
	const { updateComment, clearComment } = useTimerStore.getState();
	const supabaseUser = useUserStore((state) => state.supabaseUser);

	return (
		<Box className="timer-container" padding="large">
			<Flex direction="row" align="stretch" gap={32}>
				<Flex direction="row" align="center" justify="center" gap={16}>
					<RunningTimerDisplay elapsedTime={elapsedTime} />
					<TimerActionButtons startTimer={startTimer} pauseTimer={pauseTimer} resetTimer={resetTimer} softResetTimer={softResetTimer} isPaused={isPaused} draftId={draftId} sessionId={sessionId} comment={comment} isSaving={isSaving} error={error} />
				</Flex>
				<TimerCommentField />
			</Flex>
		</Box>
	);
}
