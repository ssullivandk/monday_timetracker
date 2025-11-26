// components/TaskItemSelector.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Flex, Text } from "@vibe/core";
import Select from "react-select";
import { useQuery } from "@tanstack/react-query";
import { useMondayStore } from "@/stores/mondayStore";
import { supabase } from "@/lib/supabase/client";

// Selection data type passed to parent
export interface TaskSelection {
	boardId?: string;
	itemId?: string;
	itemName?: string;
	role?: string;
}

interface TaskItemSelectorProps {
	onSelectionChange: (data: TaskSelection) => void;
	onResetRef?: (resetFn: () => void) => void;
	initialValues?: {
		boardId?: string;
		itemId?: string;
		role?: string;
	};
}

type DropdownOption = {
	id: string;
	value: string;
	label: string;
	disabled?: boolean;
	[key: string]: unknown;
};

type DropdownGroupOption = {
	label: string;
	options: DropdownOption[];
};

type TaskGroupsResponse = {
	groups: {
		label: string;
		options: {
			value: string;
			label: string;
		}[];
	}[];
};

export default function TaskItemSelector({ onSelectionChange, onResetRef, initialValues }: TaskItemSelectorProps) {
	// State management for selections
	const [tasks, setTasks] = useState<DropdownGroupOption[]>([]);
	const [selectedBoard, setSelectedBoard] = useState<DropdownOption | null>(null);
	const [selectedTask, setSelectedTask] = useState<DropdownOption | null>(null);
	const [selectedRole, setSelectedRole] = useState<DropdownOption | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Use mondayStore for context
	const { rawContext } = useMondayStore();

	// Reset functions
	const resetBoard = useCallback(() => {
		setSelectedBoard(null);
		setSelectedTask(null);
	}, []);

	const resetTask = useCallback(() => {
		setSelectedTask(null);
	}, []);

	const resetRole = useCallback(() => {
		setSelectedRole(null);
	}, []);

	const resetSelections = useCallback(() => {
		resetBoard();
		resetTask();
		resetRole();
		setTasks([]);
		onSelectionChange({
			boardId: undefined,
			itemId: undefined,
			itemName: undefined,
			role: undefined,
		});
	}, [onSelectionChange, resetBoard, resetTask, resetRole]);

	// Provide reset function to parent via callback
	useEffect(() => {
		if (onResetRef) {
			onResetRef(resetSelections);
		}
	}, [onResetRef, resetSelections]);

	// Boards query using React Query
	const boardIds = rawContext?.data?.boardIds;
	const {
		data: boards = [],
		isLoading: loadingBoards,
		error: boardsError,
	} = useQuery({
		queryKey: ["boards", boardIds],
		queryFn: async () => {
			if (!boardIds || boardIds.length === 0) return [];

			const response = await fetch("/api/connectedBoards", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ boardIds }),
			});

			if (!response.ok) {
				throw new Error("Failed to fetch boards");
			}

			const data = await response.json();

			if (data.error) {
				throw new Error(data.error);
			}

			return (data.boards || []).map((board: any) => ({
				label: board.label,
				id: board.value.toString(),
				value: board.value.toString(),
			}));
		},
		enabled: !!boardIds?.length,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});

	// Roles query
	const { data: roles = [], isLoading: loadingRoles } = useQuery({
		queryKey: ["roles"],
		queryFn: async () => {
			const { data, error } = await supabase.from("role").select("*");
			if (error) throw error;
			return data.map((role) => ({
				label: role.name,
				id: role.id,
				value: role.id,
			}));
		},
		staleTime: 10 * 60 * 1000, // Roles change infrequently
	});

	// Tasks query
	const {
		data: tasksData,
		isLoading: isLoadingTasks,
		error: tasksError,
	} = useQuery<TaskGroupsResponse>({
		queryKey: ["tasks", selectedBoard?.id],
		queryFn: async () => {
			if (!selectedBoard) return { groups: [] };
			const params = new URLSearchParams({ boardId: selectedBoard.id });
			const response = await fetch(`/api/tasks?${params}`);
			if (!response.ok) {
				throw new Error("Failed to fetch tasks");
			}
			return response.json();
		},
		enabled: !!selectedBoard,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	// Handle boards error
	useEffect(() => {
		if (boardsError) {
			console.error("Error loading boards:", boardsError);
			setError("Fehler beim Laden der Boards");
		}
	}, [boardsError]);

	// Set initial board when boards load
	useEffect(() => {
		if (initialValues?.boardId && boards.length > 0 && !selectedBoard) {
			const initialBoard = boards.find((board: DropdownOption) => board.id === initialValues.boardId);
			if (initialBoard) {
				setSelectedBoard(initialBoard);
			}
		}
	}, [boards, initialValues?.boardId, selectedBoard]);

	// Set initial role when roles load
	useEffect(() => {
		if (initialValues?.role && roles.length > 0 && !selectedRole) {
			const initialRole = roles.find((role: DropdownOption) => role.id === initialValues.role);
			if (initialRole) {
				setSelectedRole(initialRole);
			}
		}
	}, [roles, initialValues?.role, selectedRole]);

	// Update tasks state when query data changes
	useEffect(() => {
		if (tasksData?.groups) {
			const mappedTasks: DropdownGroupOption[] = tasksData.groups.map((group) => ({
				label: group.label,
				options: group.options.map((option) => ({
					id: option.value,
					value: option.value,
					label: option.label,
				})),
			}));
			setTasks(mappedTasks);
			setError(null);

			// Set initial task if provided
			if (initialValues?.itemId && mappedTasks.length > 0 && !selectedTask) {
				const initialTask = mappedTasks.flatMap((group) => group.options).find((task) => task.id === initialValues.itemId);
				if (initialTask) {
					setSelectedTask(initialTask);
				}
			}
		}
	}, [tasksData, initialValues?.itemId, selectedTask]);

	// Handle tasks error
	useEffect(() => {
		if (tasksError) {
			console.error("Error loading tasks:", tasksError);
			setError("Fehler beim Laden der Aufgaben");
			setTasks([]);
		}
	}, [tasksError]);

	// Handle board selection
	const handleBoardChange = useCallback(
		(option: DropdownOption | null) => {
			setSelectedBoard(option);
			setSelectedTask(null);

			if (!option) {
				setTasks([]);
			}
			// React Query will handle fetching automatically via enabled prop when option is set

			onSelectionChange({
				boardId: option?.id,
				itemId: undefined,
				itemName: undefined,
				role: selectedRole?.id,
			});
		},
		[selectedRole, onSelectionChange]
	);

	// Handle task selection - includes itemName
	const handleTaskChange = useCallback(
		(option: DropdownOption | null) => {
			// Prevent selection of loading placeholder items
			if ((typeof option?.id === "string" && option.id.startsWith("loading-")) || option?.disabled) {
				return;
			}

			setSelectedTask(option);

			onSelectionChange({
				boardId: selectedBoard?.id,
				itemId: option?.id,
				itemName: option?.label,
				role: selectedRole?.id,
			});
		},
		[selectedBoard, selectedRole, onSelectionChange]
	);

	// Handle role selection
	const handleRoleChange = useCallback(
		(option: DropdownOption | null) => {
			setSelectedRole(option);

			onSelectionChange({
				boardId: selectedBoard?.id,
				itemId: selectedTask?.id,
				itemName: selectedTask?.label,
				role: option?.id,
			});
		},
		[selectedBoard, selectedTask, onSelectionChange]
	);

	const taskPlaceholder = isLoadingTasks ? "Lade Aufgaben..." : selectedBoard ? "Aufgabe auswählen..." : "Zuerst ein Board auswählen";

	return (
		<Flex
			direction="column"
			align="stretch"
			gap="large"
			style={{
				width: "100%",
			}}
		>
			{/* Error Display */}
			{error && <Text style={{ color: "var(--negative-color)" }}>{error}</Text>}

			{/* Board Selector */}
			<label htmlFor="board-selector">Board auswählen</label>
			<Select
				id="board-selector"
				className="dropdown dropdown-board"
				placeholder="Board auswählen..."
				options={boards}
				value={selectedBoard}
				onChange={handleBoardChange}
				isClearable
				isSearchable
				isLoading={loadingBoards}
				noOptionsMessage={() => "Keine Boards verfügbar"}
				aria-label="Board auswählen"
				menuPortalTarget={document.getElementById("save-timer-modal-outer") || undefined}
				styles={{
					menuPortal: (base) => ({ ...base, zIndex: 10001 }),
				}}
			/>

			{/* Task Selector - with groups */}
			<label htmlFor="task-selector">Aufgabe auswählen</label>
			<Select
				id="task-selector"
				className="dropdown dropdown-task"
				placeholder={taskPlaceholder}
				options={tasks}
				value={selectedTask}
				onChange={handleTaskChange}
				isClearable
				isSearchable={!isLoadingTasks}
				isDisabled={!selectedBoard}
				noOptionsMessage={() => (!selectedBoard ? "Wählen Sie zuerst ein Board aus" : "Keine Aufgaben gefunden")}
				isLoading={isLoadingTasks}
				aria-label="Aufgabe auswählen"
				menuPortalTarget={document.getElementById("save-timer-modal-outer") || undefined}
				styles={{
					menuPortal: (base) => ({ ...base, zIndex: 10001 }),
				}}
			/>

			{/* Role Selector */}
			<label htmlFor="role-selector">Rolle auswählen</label>
			<Select
				id="role-selector"
				className="dropdown dropdown-role"
				placeholder="Rolle auswählen..."
				options={roles}
				value={selectedRole}
				onChange={handleRoleChange}
				isClearable
				isSearchable
				isLoading={loadingRoles}
				noOptionsMessage={() => "Keine Rollen verfügbar"}
				aria-label="Rolle auswählen"
				menuPortalTarget={document.getElementById("save-timer-modal-outer") || undefined}
				styles={{
					menuPortal: (base) => ({ ...base, zIndex: 10001 }),
				}}
			/>
		</Flex>
	);
}
