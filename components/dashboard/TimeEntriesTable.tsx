"use client";

import { useState, useMemo } from "react";
import { useUserStore } from "@/stores/userStore";
import { useTimerStore, useTimerComputed } from "@/stores/timerStore";
import { useTimeEntriesStore } from "@/stores/timeEntriesStore";
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell, Checkbox } from "@vibe/core";
import { TimeEntry } from "@/types/time-entry";
import { formatDuration } from "@/lib/utils";

interface TimeEntriesTableProps {
	timeEntries: TimeEntry[];
	loading: boolean;
	error: string | null;
	onRefetch: () => void;
}

export default function TimeEntriesTable({ onRefetch }: TimeEntriesTableProps) {
	const { timeEntries, loading, error } = useTimeEntriesStore();
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	// Use new timer store selectors
	const elapsedTime = useTimerStore((s) => s.elapsedTime);
	const sessionId = useTimerStore((s) => s.sessionId);
	const draftId = useTimerStore((s) => s.draftId);
	const { isActive, isPaused, hasSession } = useTimerComputed();

	const userId = useUserStore((state) => state.supabaseUser?.id);

	const columns = [
		{
			id: "selection",
			title: "",
			loadingStateType: "circle" as const,
			width: 40,
		},
		{
			id: "task",
			title: "Aufgabe",
			loadingStateType: "medium-text" as const,
		},
		{
			id: "board",
			title: "Board",
			loadingStateType: "medium-text" as const,
		},
		{
			id: "job",
			title: "Job",
			loadingStateType: "medium-text" as const,
		},
		{
			id: "comment",
			title: "Kommentar",
			loadingStateType: "medium-text" as const,
		},
		{
			id: "date",
			title: "Datum",
			loadingStateType: "medium-text" as const,
			width: 150,
		},
		{
			id: "start",
			title: "Start",
			loadingStateType: "medium-text" as const,
			width: 100,
		},
		{
			id: "end",
			title: "Ende",
			loadingStateType: "medium-text" as const,
			width: 100,
		},
		{
			id: "totalTime",
			title: "Gesamtzeit",
			loadingStateType: "medium-text" as const,
			width: 120,
		},
	];

	// Selection logic
	const selectAllState = useMemo(() => {
		const total = timeEntries.length;
		const selected = selectedIds.length;
		return {
			checked: total > 0 && selected === total,
			indeterminate: selected > 0 && selected < total,
		};
	}, [selectedIds, timeEntries.length]);

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedIds(timeEntries.map((entry) => entry.id.toString()));
		} else {
			setSelectedIds([]);
		}
	};

	const handleRowSelect = (entryId: string, checked: boolean) => {
		if (checked) {
			setSelectedIds((prev) => [...prev, entryId]);
		} else {
			setSelectedIds((prev) => prev.filter((id) => id !== entryId));
		}
	};

	if (loading) {
		return <div>Loading time entries...</div>;
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<Table columns={columns} emptyState={<h1 style={{ textAlign: "center" }}>Empty State</h1>} errorState={<h1 style={{ textAlign: "center" }}>Error State</h1>} id="time-entries-table">
			<TableHeader>
				<TableHeaderCell title={<Checkbox checked={selectAllState.checked} indeterminate={selectAllState.indeterminate} onChange={(e) => handleSelectAll(e.target.checked)} ariaLabel="Alle Zeiteinträge auswählen" />} sticky />
				<TableHeaderCell title="Aufgabe" sticky />
				<TableHeaderCell title="Board" sticky />
				<TableHeaderCell title="Job" sticky />
				<TableHeaderCell title="Kommentar" sticky />
				<TableHeaderCell title="Datum" sticky />
				<TableHeaderCell title="Start" sticky />
				<TableHeaderCell title="Ende" sticky />
				<TableHeaderCell title="Gesamtzeit" sticky />
			</TableHeader>
			<TableBody>
				{timeEntries.map((entry) => (
					<TableRow key={entry.id} highlighted={selectedIds.includes(entry.id.toString())}>
						<TableCell sticky>
							<Checkbox checked={selectedIds.includes(entry.id.toString())} onChange={(e) => handleRowSelect(entry.id.toString(), e.target.checked)} ariaLabel={`Select time entry ${entry.id}`} />
						</TableCell>
						<TableCell sticky>{entry.task_name}</TableCell>
						<TableCell>{entry.board_id || "-"}</TableCell>
						<TableCell>{entry.role || "-"}</TableCell>
						<TableCell>{entry.comment || "-"}</TableCell>
						<TableCell>{new Date(entry.start_time).toLocaleDateString()}</TableCell>
						<TableCell>{new Date(entry.start_time).toLocaleTimeString()}</TableCell>
						<TableCell>{new Date(entry.end_time).toLocaleTimeString()}</TableCell>
						<TableCell>{formatDuration(entry.duration)}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
