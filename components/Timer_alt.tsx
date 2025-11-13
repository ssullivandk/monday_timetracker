"use client";

import { useState, useEffect, useRef } from "react";
import { useMondayContext } from "@/hooks/useMondayContext";
import { useTimerState } from "@/hooks/useTimerState";
import { useCommentFieldState } from "@/hooks/useCommentFieldState";
import { formatTime } from "@/lib/utils";
import { Box, Button, Dropdown, Flex, Heading, Icon, IconButton, Text, TextField } from "@vibe/core";
import RunningTimerDisplay from "@/components/RunningTimerDisplay";
import TimerActionButtons from "@/components/TimerActionButtons";
import TimerCommentField from "@/components/TimerCommentField";
import { Check, Pause, Play, Retry } from "@vibe/icons";
import axios from "axios";
/* import TaskItemSelector from "./TaskItemSelector"; */

import dynamic from "next/dynamic";
const TaskItemSelector = dynamic(() => import("./TaskItemSelector"), { ssr: false });
import { useQuery } from "@tanstack/react-query";

export default function Timer() {
	const { elapsedTime, startTimer, pauseTimer, resetTimer } = useTimerState();
	const { clearComment, setComment, comment } = useCommentFieldState();
	const [isRunning, setIsRunning] = useState(false);
	const [isPaused, setIsPaused] = useState(false);

	const handleStart = () => {
		console.log("Timer started");
		setIsRunning(true);
	};

	const handlePause = () => {
		console.log("Timer paused");
		setIsPaused(true);
	};

	const handleResume = () => {
		console.log("Timer resumed");
		setIsPaused(false);
	};

	const handleDraft = () => {
		console.log("Draft action triggered");
		// Implement draft logic here
	};

	const handleSave = () => {
		console.log("Save action triggered");
		// Implement save logic here
	};

	const handleReset = () => {
		console.log("Reset action triggered");
		resetTimer();
		clearComment();
		setIsRunning(false);
		setIsPaused(false);
	};

	return (
		<Box className="timer-container" padding="large">
			<Flex direction="row" align="stretch" gap={32}>
				{/* Timer Display */}
				<Flex direction="row" align="center" justify="center" gap={16}>
					<RunningTimerDisplay isRunning={isRunning} isPaused={isPaused} elapsedTime={elapsedTime} resetTimer={handleReset} clearComment={clearComment} />
					<TimerActionButtons onClickStart={handleStart} onClickPause={handlePause} onClickResume={handleResume} onClickDraft={handleDraft} onClickSave={handleSave} isRunning={isRunning} isPaused={isPaused} />
				</Flex>
				{/* Comment Field */}
				<TimerCommentField clearComment={clearComment} setComment={setComment} comment={comment} />
			</Flex>
		</Box>
	);
}
