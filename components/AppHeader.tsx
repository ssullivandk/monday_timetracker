import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Logo } from "./Logo";
import Timer from "@/components/Timer";
import ManualTimeEntryButton from "@/components/ManualTimeEntryButton";
import { Flex } from "@vibe/core";

const ManualTimeEntryModal = dynamic(() => import("./ManualTimeEntryModal"), { ssr: false });
const SaveTimerModal = dynamic(() => import("./dashboard/SaveTimerModal"), { ssr: false });

import "@/public/css/components/AppHeader.css";

export default function AppHeader(variant?) {
	const [showManualSaveModal, setShowManualSaveModal] = useState(false);
	const [showTimerSaveModal, setShowTimerSaveModal] = useState(false);

	const handleManualTimeModalOpen = useCallback(() => {
		setShowManualSaveModal(true);
	}, []);

	const handleManualTimeModalClose = useCallback(() => {
		setShowManualSaveModal(false);
	}, []);

	const handleTimerSaveModalOpen = useCallback(() => {
		setShowTimerSaveModal(true);
	}, []);

	const handleTimerSaveModalClose = useCallback(() => {
		setShowTimerSaveModal(false);
	}, []);

	return (
		<>
			<header id="appHeader" className={`widget-header ${variant}`}>
				<Flex align="center" gap={16}>
					<Logo size={{ width: 231, height: 40 }} style="brand" />
					<ManualTimeEntryButton
						onClick={() => {
							handleManualTimeModalOpen();
						}}
					/>
				</Flex>
				<Timer onSave={handleTimerSaveModalOpen} />
			</header>
			<ManualTimeEntryModal show={showManualSaveModal} onClose={handleManualTimeModalClose} />
			<SaveTimerModal show={showTimerSaveModal} onClose={handleTimerSaveModalClose} />
		</>
	);
}
