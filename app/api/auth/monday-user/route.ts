import { NextResponse } from "next/server";
import { findOrCreateUserByMondayId } from "@/lib/database/users";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mondayUserId, mondayAccountId, email, name } = body;

        // Validate required fields
        if (!mondayUserId || !mondayAccountId) {
            return NextResponse.json(
                { error: "Missing required fields: mondayUserId and mondayAccountId" },
                { status: 400 }
            );
        }

        // Find or create user
        const userProfile = await findOrCreateUserByMondayId(
            mondayUserId,
            mondayAccountId,
            email,
            name
        );

        return NextResponse.json({
            success: true,
            user: userProfile,
        });
    } catch (error) {
        console.error("Error in monday-user endpoint:", error);
        return NextResponse.json(
            { error: "Failed to authenticate user" },
            { status: 500 }
        );
    }
}