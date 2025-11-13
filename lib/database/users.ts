import { supabaseAdmin } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"];

/**
 * Find or create a user profile based on Monday.com user ID
 * This is the main function you'll use when the app loads
 */
export async function findOrCreateUserByMondayId(
    mondayUserId: string,
    mondayAccountId: string,
    email?: string,
    name?: string
): Promise<UserProfile> {
    // First, try to find existing user by Monday ID
    const { data: existingUser, error: findError } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("monday_user_id", mondayUserId)
        .single();

    // If user exists, return them
    if (existingUser && !findError) {
        console.log(`✅ Found existing user: ${existingUser.id}`);
        return existingUser;
    }

    // If error is something other than "not found", throw it
    if (findError && findError.code !== "PGRST116") {
        console.error("Error finding user:", findError);
        throw findError;
    }

    // User doesn't exist - create new one
    console.log(`📝 Creating new user for Monday ID: ${mondayUserId}`);

    const newUser: UserProfileInsert = {
        id: crypto.randomUUID(), // Generate Supabase user ID
        monday_user_id: mondayUserId,
        monday_account_id: mondayAccountId,
        email: email || null,
        name: name || null,
    };

    const { data: createdUser, error: createError } = await supabaseAdmin
        .from("user_profiles")
        .insert(newUser)
        .select()
        .single();

    if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
    }

    console.log(`✅ Created new user: ${createdUser.id}`);
    return createdUser;
}

/**
 * Get user profile by Supabase user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            // User not found
            return null;
        }
        console.error("Error fetching user profile:", error);
        throw error;
    }

    return data;
}

/**
 * Update user profile (e.g., if Monday.com info changes)
 */
export async function updateUserProfile(
    userId: string,
    updates: {
        email?: string;
        name?: string;
    }
): Promise<UserProfile> {
    const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

    if (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }

    return data;
}