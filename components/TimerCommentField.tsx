import { useState } from "react";
import { Flex, TextField } from "@vibe/core";

import "@/public/css/components/TimerCommentField.css";

export default function TimerCommentField({ setComment, comment, activeSession }: { setComment?: (value: string) => void; comment?: string; activeSession?: boolean }) {
	const [focus, setFocus] = useState(false);
	const handleBlur = async () => {
		setComment;
		setFocus(false);
	};

	const handleFocus = () => {
		setFocus(true);
	};

	return (
		<Flex direction="row" align="center" className="timer-comment-field-container" gap="small">
			<TextField className={`timer-comment-field${focus ? " focus" : ""}`} wrapperClassName="timer-comment-field-wrapper" placeholder="Kommentar hinzufügen..." inputAriaLabel="Kommentar hinzufügen..." onChange={setComment} onBlur={handleBlur} onFocus={handleFocus} value={comment} disabled={!activeSession} />
		</Flex>
	);
}
