"use client";

import { useState, useEffect } from "react";
import { Flex, Text, TextField } from "@vibe/core";
import { formatTime } from "@/lib/utils";
import { Modal, ModalBasicLayout, ModalHeader, ModalContent, ModalFooter } from "@vibe/core/next";
import TaskItemSelector from "../TaskItemSelector";
import { useCommentFieldState } from "@/hooks/useCommentFieldState";
import { useTimerManualSave } from "@/hooks/useTimerManualSave";
import { useTimerState } from "@/hooks/useTimerState";
import { supabase } from "@/lib/supabase/client";

interface SaveTimerModalProps {
	show: boolean;
	onClose: () => void;
}

export default function SaveTimerModal({ show, onClose }: SaveTimerModalProps) {
	const [selectedTask, setSelectedTask] = useState<{ boardId?: string; itemId?: string; role?: string } | null>(null);
	const { elapsedTime, draftId, sessionId, softResetTimer } = useTimerState();
	const [initialComment, setInitialComment] = useState("");
	const { clearComment, setComment, comment } = useCommentFieldState(initialComment, sessionId);
	const { saveTimeEntry, isSaving, error } = useTimerManualSave({
		comment, // Use comment as comment (not task name)
		onSaved: () => {
			onClose();
			// Reset timer state after successful save
		},
	});

	// Load comment from existing draft when session loads
	useEffect(() => {
		if (draftId) {
			const loadComment = async () => {
				const { data: draft } = await supabase.from("time_entry").select("comment").eq("id", draftId).single();

				if (draft?.comment) {
					setInitialComment(draft.comment);
					setComment(draft.comment);
				}
			};
			loadComment();
		} else {
			console.log("No draftId in SaveTimerModal useEffect");
			setInitialComment("");
			setComment("");
		}
	}, [draftId, setComment]);

	console.log("SaveTimerModal rendered with:", { show, elapsedTime, draftId, sessionId, selectedTask, comment });

	const handleTaskSelection = (taskData: { boardId?: string; itemId?: string; role?: string }) => {
		setSelectedTask(taskData);
	};

	const handleSave = async () => {
		console.log("SaveTimerModal: handleSave called.");
		console.log("Draft ID:", draftId);
		console.log("Selected Task:", selectedTask);
		if (!draftId || !selectedTask) {
			switch (true) {
				case !draftId:
					console.error("Cannot save time entry: missing draftId.");
					break;
				case !selectedTask:
					console.error("Cannot save time entry: no task selected.");
					break;
			}
			return;
		}

		// Use selected task name as task_name, comment as comment
		const taskName = selectedTask.itemId ? `Task ${selectedTask.itemId}` : "Manual Entry";

		await saveTimeEntry(draftId, taskName, comment, selectedTask.boardId, selectedTask.itemId, selectedTask.role);
		softResetTimer();
	};

	return (
		<Flex id="save-timer-modal-outer">
			<Modal id="save-timer-modal" show={show} onClose={onClose} container={document.getElementById("save-timer-modal-outer") || undefined}>
				<ModalBasicLayout>
					<ModalHeader title={"Save Timer"} />
					<ModalContent>
						<Flex direction="column" gap={16}>
							<Text>Elapsed Time: {formatTime(elapsedTime)}</Text>

							<TaskItemSelector
								onSelectionChange={handleTaskSelection}
								onResetRef={(resetFn) => {
									/* store reset function */
								}}
							/>

							<TextField inputAriaLabel="Kommentar hinzufügen..." value={comment} onChange={setComment} placeholder="Kommentar hinzufügen..." />
						</Flex>
					</ModalContent>
				</ModalBasicLayout>
				<ModalFooter
					primaryButton={{
						text: "Speichern",
						onClick: () => {
							handleSave();
						},
						ariaLabel: "Zeit-Eintrag speichern",
						disabled: !selectedTask || isSaving,
					}}
					secondaryButton={{
						text: "Abbrechen",
						onClick: () => {
							console.log("secondary modal button clicked.");
							onClose();
						},
						ariaLabel: "Zeit-Eintrag abbrechen",
					}}
				/>
			</Modal>
		</Flex>
	);
}
