// components/TimerControls.tsx
"use client";

import { Button, Flex } from "@vibe/core";
import Play from "@/components/icons/Play";
import Pause from "@/components/icons/Pause";
import MoveDown from "@/components/icons/MoveDown";
import Save from "@/components/icons/Save";
import type { TimerControlsProps } from "@/types/timer.types";
import "@/public/css/components/TimerActionButtons.css";

/**
 * TimerControls - Presentational component for timer action buttons
 *
 * This is a pure presentational component that:
 * - Receives all data and callbacks via props
 * - Has NO store access
 * - Only handles rendering
 *
 * @param status - Timer status (idle, running, paused)
 * @param hasSession - Whether there is an active timer session
 * @param isSaving - Whether a save operation is in progress
 * @param onPlayPause - Callback for play/pause button
 * @param onSaveAsDraft - Callback for save as draft button
 * @param onSave - Callback for save button (opens modal)
 */
export default function TimerControls({ status, hasSession, isSaving, onPlayPause, onSaveAsDraft, onSave }: TimerControlsProps) {
	const isRunning = status === "running";

	const activeColor = "var(--color--text-on-primary)";
	const disabledColor = "var(--color--text-disabled)";

	// Determine which icon to show for play/pause button
	const PlayPauseIcon = isRunning ? <Pause fillColor={activeColor} /> : <Play fillColor={activeColor} />;

	return (
		<Flex>
			<Button className="button button--timer play-pause" kind="primary" size="small" onClick={onPlayPause} disabled={isSaving}>
				{PlayPauseIcon}
			</Button>
			<Button className="button button--timer draft" kind="primary" size="small" onClick={onSaveAsDraft} disabled={!hasSession || isSaving}>
				<MoveDown fillColor={hasSession ? activeColor : disabledColor} />
			</Button>
			<Button className="button button--timer save" kind="primary" size="small" onClick={onSave} disabled={!hasSession || isSaving}>
				<Save fillColor={hasSession ? activeColor : disabledColor} />
			</Button>
		</Flex>
	);
}
