// components/TimerActionButtons.tsx
"use client";

import { Button, Flex } from "@vibe/core";
import Play from "@/components/icons/Play";
import Pause from "@/components/icons/Pause";
import MoveDown from "@/components/icons/MoveDown";
import Save from "@/components/icons/Save";
import { useTimerStore } from "@/stores/timerStore";
import { useTimerStateSSR } from "@/hooks/useTimerState";
import { useDraftStore } from "@/stores/draftStore";
import { useModalStore } from "@/stores/modalStore";
import { useUserStore } from "@/stores/userStore";
import { useTimeEntriesStore } from "@/stores/timeEntriesStore";
import { useToast } from "./ToastProvider";
import "@/public/css/components/TimerActionButtons.css";

export default function TimerActionButtons({ startTimer, pauseTimer, resetTimer, softResetTimer, isPaused, draftId, sessionId, comment, isSaving, error }) {
	const { showToast } = useToast();
	const { saveDraft } = useDraftStore();
	const supabaseUser = useUserStore((state) => state.supabaseUser);
	const { updateComment, clearComment } = useTimerStore.getState();
	const { refetch } = useTimeEntriesStore((s) => s);
	const { openTimerSave } = useModalStore((s) => s);

	const handleStart = () => {
		startTimer();
	};

	const handlePause = () => {
		pauseTimer();
	};

	const handleResume = () => {
		startTimer();
	};

	const handleSaveAsDraft = async () => {
		if (draftId && supabaseUser?.id) {
			await saveDraft({
				draftId,
				userProfileId: supabaseUser.id,
				comment: comment,
			});
		}
		softResetTimer();
		refetch(supabaseUser?.id);
	};

	const handleSave = () => {
		if (!isPaused) {
			pauseTimer();
		}
		openTimerSave();
	};

	const playPauseButton = !sessionId ? <Play fillColor={"var(--color--text-on-primary)"} /> : isPaused ? <Play fillColor={"var(--color--text-on-primary)"} /> : <Pause fillColor={"var(--color--text-on-primary)"} />;

	const playPauseAction = !sessionId ? handleStart : isPaused ? handleResume : handlePause;

	return (
		<Flex>
			<Button className="button button--timer play-pause" kind="primary" size="small" onClick={playPauseAction} disabled={isSaving}>
				{playPauseButton}
			</Button>
			<Button className="button button--timer draft" kind="primary" size="small" onClick={handleSaveAsDraft} disabled={!sessionId || isSaving}>
				<MoveDown fillColor={sessionId ? "var(--color--text-on-primary)" : "var(--color--text-disabled)"} />
			</Button>
			<Button className="button button--timer save" kind="primary" size="small" onClick={handleSave} disabled={!sessionId || isSaving}>
				<Save fillColor={sessionId ? "var(--color--text-on-primary)" : "var(--color--text-disabled)"} />
			</Button>
		</Flex>
	);
}
