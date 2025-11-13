import { useState } from "react";
import { useDraftAutoSave } from "./useDraftAutoSave";

export function useCommentFieldState(initialValue: string = "") {
    const [comment, setComment] = useState(initialValue);

    // Auto-save draft when comment changes (assuming useDraftAutoSave handles debounced saving)
    useDraftAutoSave({comment, userId: "currentUserId"}); // Replace "currentUserId" with actual user ID as needed

    const clearComment = () => setComment("");

    return { comment, setComment, clearComment };
}