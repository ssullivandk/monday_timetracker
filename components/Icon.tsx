// Icon component
// Imports and embeds SVG icons

import Add from "@/public/img/icons/add.svg";

export function Icon(icon) {
	const icons = {
		add: <Add />,
	};

	// Return the raw SVG element for the requested icon
	return icons[icon];
}
