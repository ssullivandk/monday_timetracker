export interface TimeEntry {
	id: number;
	user_id: string; // Supabase auth user UUID
	task_name: string;
	start_time: string; // ISO 8601 timestamp string
	end_time: string; // ISO 8601 timestamp string
	duration: number; // Duration in seconds
	board_id: string | null;
	item_id: string | null;
	role: string | null;
	is_draft: boolean;
	comment: string | null;
	synced_to_monday: boolean;
	created_at: string; // ISO 8601 timestamp string
	updated_at: string; // ISO 8601 timestamp string

}
