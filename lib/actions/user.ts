"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { users } from "@/config/schema";
import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { isAccentId } from "@/lib/accents";

/**
 * Copy the user's current Clerk profile (name, avatar) into our users table.
 * Called right after the profile is edited in the app, so the DB updates
 * immediately instead of waiting for the Clerk user.updated webhook
 * (which still runs too, and is idempotent).
 */
export async function syncProfileFromClerkAction() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized.");

    const name =
      `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
      "Anonymous User";

    const [updated] = await db
      .update(users)
      .set({ name, imageUrl: clerkUser.imageUrl, updatedAt: new Date() })
      .where(eq(users.id, clerkUser.id))
      .returning();

    return { success: true as const, data: updated ?? null };
  } catch (error) {
    console.error("Profile Sync Failure:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to sync profile.",
    };
  }
}

/** Remember the user's accent color theme on their account (cross-device). */
export async function updateThemeAccentAction(accent: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in." };
    if (!isAccentId(accent)) throw new Error("Unknown color theme.");

    await db
      .update(users)
      .set({ themeAccent: accent, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true as const };
  } catch (error) {
    console.error("Theme Accent Update Failure:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to save theme.",
    };
  }
}

// This is the wrapper you call in your components
export const getCurrentUser = async () => {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, data: null };
  }

  const [data] = await db.select().from(users).where(eq(users.id, userId));

  return {
    success: !!data,
    data: data,
  };
};
