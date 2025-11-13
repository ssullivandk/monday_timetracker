import { NextRequest, NextResponse } from "next/server";
import { ClientError } from "@mondaydotcomorg/api";
import { getBoardTasks } from "@/lib/monday";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get("boardId");
  const searchTerm = searchParams.get("searchTerm");

  // Validate boardId as a valid positive integer string
  if (!boardId || isNaN(Number(boardId)) || Number(boardId) <= 0) {
    return NextResponse.json({ error: "boardId must be a valid positive integer" }, { status: 400 });
  }

  try {
    const tasksData = await getBoardTasks(boardId, searchTerm);

    return NextResponse.json(tasksData);
  } catch (error) {
    if (error instanceof ClientError) {
      console.error("Monday API ClientError:", error.response?.errors);
      return NextResponse.json({ error: error.response?.errors?.[0]?.message || "Failed to fetch tasks" }, { status: 500 });
    }
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
