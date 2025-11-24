import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	try {
		// Get headers
		const userIdHeader = request.headers.get("user-id");
		if (!userIdHeader) {
			return NextResponse.json({ error: "Missing user-id header" }, { status: 400 });
		}

		const draftIdHeader = request.headers.get("draft-id");
		if (!draftIdHeader) {
			return NextResponse.json({ error: "Missing draft-id header" }, { status: 400 });
		}

		const sessionIdHeader = request.headers.get("session-id");
		if (!sessionIdHeader) {
			return NextResponse.json({ error: "Missing session-id header" }, { status: 400 });
		}

		console.log("Resetting timer for user:", userIdHeader, "draft:", draftIdHeader, "session:", sessionIdHeader);

		// Delete timer_session first (cascades to timer_segments)
		const { error: sessionError } = await supabaseAdmin.from("timer_session").delete().eq("id", sessionIdHeader).eq("user_id", userIdHeader);

		if (sessionError) throw sessionError;

		// Then delete draft time_entry
		const { error: draftError } = await supabaseAdmin.from("time_entry").delete().eq("id", draftIdHeader).eq("user_id", userIdHeader);

		if (draftError) throw draftError;

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error resetting timer:", error);
		return NextResponse.json({ error: "Failed to reset timer" }, { status: 500 });
	}
}
