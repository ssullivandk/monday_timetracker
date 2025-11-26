// components/dashboard/SaveTimerModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Flex, Text, TextField } from "@vibe/core";
import { formatTime } from "@/lib/utils";
import { Modal, ModalBasicLayout, ModalHeader, ModalContent, ModalFooter } from "@vibe/core/next";
import TaskItemSelector, { TaskSelection } from "../TaskItemSelector";
import { useTimerStore } from "@/stores/timerStore";
import { useUserStore } from "@/stores/userStore";
import { useTimeEntriesStore } from "@/stores/timeEntriesStore";
import { useMondayStore } from "@/stores/mondayStore";
import { useToast } from "@/components/ToastProvider";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

interface SaveTimerModalProps {
	show: boolean;
	onClose: () => void;
}

/**
 * SaveTimerModal - Modal for saving a timer session to a time entry
 *
 * This component allows the user to:
 * - Select a task/item to associate the time entry with
 * - Add/edit a comment
 * - Save the time entry
 */
export default function SaveTimerModal({ show, onClose }: SaveTimerModalProps) {
	const [selectedTask, setSelectedTask] = useState<TaskSelection | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Store selectors
	const { refetch } = useTimeEntriesStore();
	const { rawContext } = useMondayStore();
	const { showToast } = useToast();
	const userProfile = useUserStore((state) => state.supabaseUser);

	// Timer store - using new API
	const comment = useTimerStore((state) => state.comment);
	const elapsedTime = useTimerStore((state) => state.elapsedTime);
	const draftId = useTimerStore((state) => state.draftId);
	const sessionId = useTimerStore((state) => state.sessionId);

	// Store actions
	const { setComment, reset: resetTimer } = useTimerStore.getState();

	// Clear error state and selection when modal opens
	useEffect(() => {
		if (show) {
			setError(null);
			setSelectedTask(null);
		}
	}, [show]);

	const handleTaskSelection = (taskData: TaskSelection) => {
		setSelectedTask(taskData);
	};

	const handleSave = async () => {
		if (!draftId || !selectedTask || !userProfile?.id) {
			console.error("Cannot save: missing required data", { draftId, selectedTask, userId: userProfile?.id });
			return;
		}

		setIsSaving(true);
		setError(null);

		try {
			// Use actual task name from selection, with fallback
			const taskName = selectedTask.itemName || "Unbenannter Zeit-Eintrag";

			// Get fresh context for the API call
			const context = rawContext || (await monday.get("context"));

			// Call API route to finalize time entry
			const response = await fetch("/api/time-entries/finalize", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"monday-context": JSON.stringify(context),
				},
				body: JSON.stringify({
					draftId,
					taskName,
					comment,
					boardId: selectedTask.boardId,
					itemId: selectedTask.itemId,
					role: selectedTask.role,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save time entry");
			}

			showToast("Zeiteintrag gespeichert.", "positive", 2000);

			// Soft reset timer via API (keeps time entry but clears session)
			if (sessionId) {
				await fetch("/api/timer/soft-reset", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"monday-context": JSON.stringify(context),
					},
					body: JSON.stringify({
						draftId,
						sessionId,
					}),
				});
			}

			// Reset local timer state
			resetTimer();

			// Refetch time entries to show the new one
			refetch(userProfile.id);

			onClose();
		} catch (err: any) {
			console.error("Error saving time entry:", err);
			setError(err.message || "Fehler beim Speichern des Zeiteintrags");
			showToast("Fehler beim Speichern", "negative", 2000);
		} finally {
			setIsSaving(false);
		}
	};

	const handleCommentChange = (value: string) => {
		setComment(value);
	};

	return (
		<div id="save-timer-modal-outer">
			<div id="modal-portal"></div>
			<Modal id="save-timer-modal" show={show} onClose={onClose} container={document.getElementById("save-timer-modal-outer") || undefined}>
				<ModalBasicLayout>
					<ModalHeader title={"Timer speichern"} />
					<ModalContent>
						<Flex direction="column" gap={16}>
							<Text>Erfasste Zeit: {formatTime(elapsedTime)}</Text>

							{error && <Text style={{ color: "var(--negative-color)" }}>{error}</Text>}

							<TaskItemSelector onSelectionChange={handleTaskSelection} />

							<TextField inputAriaLabel="Kommentar hinzufügen..." value={comment} onChange={handleCommentChange} placeholder="Kommentar hinzufügen..." />
						</Flex>
					</ModalContent>
				</ModalBasicLayout>
				<ModalFooter
					primaryButton={{
						text: isSaving ? "Speichern..." : "Speichern",
						onClick: handleSave,
						ariaLabel: "Zeit-Eintrag speichern",
						disabled: !selectedTask?.itemId || isSaving,
					}}
					secondaryButton={{
						text: "Abbrechen",
						onClick: onClose,
						ariaLabel: "Speichervorgang abbrechen",
					}}
				/>
			</Modal>
		</div>
	);
}
