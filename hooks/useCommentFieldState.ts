import { useState } from "react";
import { useDraftAutoSave } from "./useDraftAutoSave";
import { useMondayContext } from "./useMondayContext";

export function useCommentFieldState(initialValue: string = "") {
	const [comment, setComment] = useState(initialValue);
	const { getUserId } = useMondayContext();

	// Auto-save draft when comment changes
	useDraftAutoSave({ comment, userId: getUserId() });

	const clearComment = () => setComment("");

	return { comment, setComment, clearComment };
}
