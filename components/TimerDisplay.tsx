// components/TimerDisplay.tsx
"use client";

import { Flex, Text, Button } from "@vibe/core";
import { formatTime } from "@/lib/utils";
import Reset from "@/components/icons/Reset";
import type { TimerDisplayProps } from "@/types/timer.types";
import "@/public/css/components/RunningTimerDisplay.css";

/**
 * TimerDisplay - Presentational component for displaying elapsed time
 *
 * This is a pure presentational component that:
 * - Receives all data via props
 * - Has NO store access
 * - Only handles rendering and local UI state
 *
 * @param elapsedTime - Time in milliseconds to display
 * @param status - Timer status (idle, running, paused)
 * @param onReset - Callback when reset button is clicked
 * @param disabled - Whether the reset button should be disabled
 */
export default function TimerDisplay({ elapsedTime, status, onReset, disabled }: TimerDisplayProps) {
	const isActive = status !== "idle";
	const isPaused = status === "paused";

	const activeColor = "var(--color--text-on-primary)";
	const disabledColor = "var(--color--text-disabled)";

	return (
		<Flex direction="row" align="center" justify="center" className="timer-display" gap="medium">
			<Text className={`timer-time${isActive ? " active" : ""}${isPaused ? " paused" : ""}`} type="text1" weight="bold">
				{formatTime(elapsedTime)}
			</Text>
			<Button className="btn-reset" onClick={onReset} kind="primary" size="small" ariaLabel="Timer zurücksetzen" disabled={disabled}>
				<Reset fillColor={!disabled ? activeColor : disabledColor} />
			</Button>
		</Flex>
	);
}
