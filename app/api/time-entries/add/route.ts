import { NextResponse } from 'next/server';
import { getDraftEntry, insertDraftEntry, updateDraftEntry } from '@/lib/database';

export async function POST(request: Request) {
  try {
    const { comment, userId } = await request.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Check for existing draft
    const existingDraft = await getDraftEntry();

    if (existingDraft) {
      // Update existing draft with new comment
      await updateDraftEntry(existingDraft.id, { comment });
    } else {
      // Create new draft entry
      await insertDraftEntry({
        user_id: userId,
        comment,
        // Other fields can be added here if needed (e.g., task_name defaults to "Draft")
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}