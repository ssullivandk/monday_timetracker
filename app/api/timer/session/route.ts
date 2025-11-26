import { NextRequest, NextResponse } from "next/server";
import { getMondayContext } from "@/lib/monday";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { GetTimerSessionWithElapsedResult } from "@/types/database";

export async function GET(request: NextRequest) {
	try {
		// Authenticate user
		const context = await getMondayContext(request);
		if (!context?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const { data: userId } = await supabaseAdmin.from("user_profiles").select("id").eq("monday_user_id", context.user.id).single();

		if (!userId) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Use the RPC function to get session with elapsed time calculated server-side
		// This avoids clock drift issues between app server and database
		const { data: result, error: rpcError } = await supabaseAdmin.rpc("get_timer_session_with_elapsed", {
			p_user_id: userId.id,
		});

		if (rpcError) {
			console.error("Error calling get_timer_session_with_elapsed:", rpcError);
			throw rpcError;
		}

		// Cast to proper type
		const typedResult = result as unknown as GetTimerSessionWithElapsedResult;

		if (typedResult?.session) {
			return NextResponse.json({
				session: {
					...typedResult.session,
					// Use the server-calculated elapsed time
					calculatedElapsedTime: typedResult.calculated_elapsed_time_ms,
				},
				serverTime: typedResult.server_time,
			});
		} else {
			return NextResponse.json({
				session: null,
				serverTime: typedResult?.server_time || new Date().toISOString(),
			});
		}
	} catch (error) {
		console.error("Error loading timer session:", error);
		return NextResponse.json({ error: "Failed to load timer session" }, { status: 500 });
	}
}
