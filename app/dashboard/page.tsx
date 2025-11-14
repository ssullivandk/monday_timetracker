"use client";

import { Logo } from "@/components/Logo";
import AppHeader from "@/components/AppHeader";
import { TimeEntry } from "@/types/time-entry";

export default function DashboardPage() {
	return (
		<div id="dashboard-app">
			<AppHeader variant="dashboard" />
		</div>
	);
}
