// hooks/useTimerState.ts
/**
 * @deprecated This file is deprecated. Use useTimer from hooks/useTimer.ts instead.
 *
 * This file is kept for backwards compatibility during migration.
 * It re-exports the new useTimer hook with the old name.
 */

export { useTimer as useTimerStateSSR, useTimer } from "./useTimer";
