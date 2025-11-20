import { NextRequest, NextResponse } from "next/server";
import { getConnectedBoards } from "@/lib/monday";

export async function POST(req: NextRequest) {
	try {
		const { boardIds } = await req.json();

		console.log("[api/connectedBoards] Received board IDs:", boardIds);

		const boards = await getConnectedBoards(boardIds || []);

		console.log("[api/connectedBoards] Returning boards:", boards);

		return NextResponse.json({ boards });
	} catch (error) {
		console.error("Error in connectedBoards endpoint:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
