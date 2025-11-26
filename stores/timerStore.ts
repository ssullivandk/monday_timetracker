// stores/timerStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { TimerStore, TimerStatus, ServerSyncRef } from "@/types/timer.types";

/**
 * Initial state for the timer store
 */
const initialState = {
	// Session data
	sessionId: null as string | null,
	draftId: null as string | null,
	elapsedTime: 0,
	startTime: null as string | null,
	status: "idle" as TimerStatus,

	// Comment
	comment: "",

	// UI state
	isSaving: false,
	isLoading: false,
	error: null as string | null,

	// Server sync reference
	_serverSync: null as ServerSyncRef | null,
};

/**
 * Timer store - pure state container with simple setters
 *
 * Design principles:
 * - No API calls in the store (moved to useTimer hook)
 * - Simple, predictable state updates
 * - Clear separation between state and actions
 * - Persist only essential data for session recovery
 */
export const useTimerStore = create<TimerStore>()(
	persist(
		(set, get) => ({
			...initialState,

			// ============================================
			// Session Management
			// ============================================

			/**
			 * Set session data from API response
			 * Pass null to clear session
			 */
			setSession: (session) => {
				if (session === null) {
					set({
						sessionId: null,
						draftId: null,
						startTime: null,
						status: "idle",
					});
					return;
				}

				set({
					sessionId: session.id ?? get().sessionId,
					draftId: session.draft_id ?? get().draftId,
					startTime: session.start_time ?? get().startTime,
					status: session.is_paused !== undefined ? (session.is_paused ? "paused" : "running") : get().status,
				});
			},

			/**
			 * Set timer status (idle, running, paused)
			 */
			setStatus: (status) => {
				set({ status });
			},

			/**
			 * Set elapsed time in milliseconds
			 */
			setElapsedTime: (elapsedTime) => {
				set({ elapsedTime });
			},

			// ============================================
			// Server Sync
			// ============================================

			/**
			 * Update server sync reference for local time calculation
			 * Called when receiving elapsed time from server
			 */
			updateServerSync: (baseTime) => {
				set({
					_serverSync: {
						baseElapsedTime: baseTime,
						syncedAt: Date.now(),
					},
				});
			},

			/**
			 * Clear server sync reference
			 */
			clearServerSync: () => {
				set({ _serverSync: null });
			},

			// ============================================
			// Comment
			// ============================================

			/**
			 * Update comment text
			 */
			setComment: (comment) => {
				set({ comment });
			},

			/**
			 * Clear comment
			 */
			clearComment: () => {
				set({ comment: "" });
			},

			// ============================================
			// UI State
			// ============================================

			/**
			 * Set saving state
			 */
			setSaving: (isSaving) => {
				set({ isSaving });
			},

			/**
			 * Set loading state
			 */
			setLoading: (isLoading) => {
				set({ isLoading });
			},

			/**
			 * Set error message
			 */
			setError: (error) => {
				set({ error });
			},

			// ============================================
			// Full Reset
			// ============================================

			/**
			 * Reset all state to initial values
			 */
			reset: () => {
				set({
					...initialState,
				});
			},
		}),
		{
			name: "timer-store",
			skipHydration: true, // Important for Next.js SSR
			partialize: (state) => ({
				// Only persist essential data for session recovery
				comment: state.comment,
				draftId: state.draftId,
				sessionId: state.sessionId,
				// Don't persist: elapsedTime (fetched from server), status, UI states, _serverSync
			}),
		}
	)
);

// ============================================
// Selector Hooks (for optimized re-renders)
// Using useShallow to prevent infinite loops with object selectors
// ============================================

/**
 * Select only session-related state
 * Uses useShallow for shallow comparison of object result
 */
export function useTimerSession() {
	return useTimerStore(
		useShallow((state) => ({
			sessionId: state.sessionId,
			draftId: state.draftId,
			startTime: state.startTime,
			status: state.status,
		}))
	);
}

/**
 * Select only elapsed time
 * Primitive value, no shallow comparison needed
 */
export function useTimerElapsed() {
	return useTimerStore((state) => state.elapsedTime);
}

/**
 * Select only comment
 * Primitive value, no shallow comparison needed
 */
export function useTimerComment() {
	return useTimerStore((state) => state.comment);
}

/**
 * Select only UI state
 * Uses useShallow for shallow comparison of object result
 */
export function useTimerUIState() {
	return useTimerStore(
		useShallow((state) => ({
			isSaving: state.isSaving,
			isLoading: state.isLoading,
			error: state.error,
		}))
	);
}

/**
 * Select computed values
 * Uses useShallow for shallow comparison of object result
 */
export function useTimerComputed() {
	return useTimerStore(
		useShallow((state) => ({
			isActive: state.status === "running",
			hasSession: state.sessionId !== null,
			canSave: state.sessionId !== null && !state.isSaving,
			isPaused: state.status === "paused",
		}))
	);
}
