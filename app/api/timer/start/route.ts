import { NextRequest, NextResponse } from "next/server";
import { startTimer } from "@/lib/database";
import { getServerSession } from "@/auth"; // Assume auth helper; use NextAuth or Supabase auth

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(); // Get authenticated user
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await startTimer(userId);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error starting timer:", error);
    return NextResponse.json({ error: "Failed to start timer" }, { status: 500 });
  }
}