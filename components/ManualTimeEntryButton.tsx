import { Button } from "@vibe/core";
import Add from "@/components/icons/Add";

export default function ManualTimeEntryButton(props: { onClick: () => void }) {
	return (
		<Button onClick={props.onClick} ariaLabel="Manuelle Zeiteingabe" ariaControls="manualTimeEntryModal">
			<Add fillColor="#FFFFFF" />
			Zeit eintragen
		</Button>
	);
}
