import { useCallback, useState } from "react";
import { Logo } from "./Logo";
import Timer from "@/components/Timer_alt";
import ManualTimeEntryButton from "@/components/ManualTimeEntryButton";
import ManualTimeEntryModal from "@/components/ManualTimeEntryModal";
import { Flex } from "@vibe/core";

import "@/public/css/components/AppHeader.css";

export default function AppHeader(variant?) {
	const [show, setShow] = useState(false);

	const handleManualTimeModalOpen = useCallback(() => {
		setShow(true);
	}, []);

	const handleManualTimeModalClose = useCallback(() => {
		setShow(false);
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
				<Timer />
			</header>
			<ManualTimeEntryModal show={show} onClose={handleManualTimeModalClose} />
		</>
	);
}
