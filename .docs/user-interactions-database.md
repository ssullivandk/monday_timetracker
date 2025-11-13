# User Interactions and Database Changes

## Database Structures

### time_entry

- `id`: uuid
- `task_name`: string | null
- `is_draft`: boolean
- `user_id`: string
- `start_time`: string
- `end_time`: string | null
- `board_id`: string | null
- `item_id`: string | null
- `role`: string | null
- `comment`: string | null
- `duration`: number | null
- `timer_sessions`: jsonb | null
- `synced_to_monday`: boolean
- `created_at`: string
- `updated_at`: string

### timer_session

- `id`: uuid
- `draft_id`: time_entry.id | null
- `user_id`: string
- `start_time`: string
- `elapsed_time`: number
- `is_running`: boolean
- `is_paused`: boolean
- `timer_segments`: jsonb | null
- `created_at`: string
- `updated_at`: string

### timer_segment

- `id`: uuid
- `session_id`: timer_session.id
- `start_time`: string
- `end_time`: string | null
- `is_running`: boolean
- `is_pause`: boolean
- `created_at`: string

## 1. Starting Timer

   1. Create draft time_entry
      1. task_name = null
      2. is_draft = true
      3. user_id = current user id
      4. start_time = now
      5. end_time = null
      6. board_id = null
      7. item_id = null
      8. role = null
      9. comment = null
      10. duration = 0
      11. synced_to_monday = false
      12. created_at = now
      13. updated_at = now
   2. Create timer_session
      1. draft_id = link to new time_entry id
      2. user_id = current user id
      3. start_time = now
      4. end_time = null
      5. is_running = true
      6. is_paused = false
      7. created_at = now
      8. updated_at = now
   3. Create running timer_segment
      1. session_id = link to new timer_session id
      2. start_time = now
      3. end_time = null
      4. is_running = true
      5. is_pause = false
      6. created_at = now
      7. updated_at = now

## 2. Pausing Timer

   1. End current running timer_segment
      1. end_time = now
   2. Create new paused timer_segment
      1. session_id = link to current timer_session id
      2. start_time = now
      3. end_time = null
      4. is_running = false
      5. is_pause = true
   3. Update current timer_session
      1. is_running = false
      2. is_paused = true
   4. Add paused timer_segment to timer_segments array
      1. timer_segments.push(new_paused_segment)
      2. updated_at = now
      3. elapsed_time = recalculate based on segments
   5. Save changes to database

## 3. Resuming Timer

  1. End current paused timer_segment
     1. end_time = now
  2. Create new running timer_segment
     1. session_id = link to current timer_session id
     2. start_time = now
     3. end_time = null
     4. is_running = true
     5. is_pause = false
  3. Update current timer_session
     1. is_running = true
     2. is_paused = false
  4. Add last timer_segment to timer_segments array
     1. timer_segments.push(new_running_segment)
     2. updated_at = now
     3. elapsed_time = recalculate based on segments
  5. Save changes to database

## 4. Move timer to list as draft

   1. End current running or paused timer_segment
      1. end_time = now
   2. Update current timer_session
      1. is_running = false
      2. is_paused = false
      3. updated_at = now
      4. elapsed_time = recalculate based on segments
   3. Update draft time_entry
      1. end_time = now
      2. duration = recalculate based on segments
      3. is_draft = true
      4. updated_at = now
   4. Save changes to database

## 5. Save timer as time entry

   1. End current running or paused timer_segment
      1. end_time = now
   2. Update current timer_session
      1. is_running = false
      2. is_paused = false
      3. updated_at = now
      4. elapsed_time = recalculate based on segments
   3. Update draft time_entry
      1. end_time = now
      2. duration = recalculate based on segments
      3. is_draft = false
      4. updated_at = now
   4. Save changes to database
