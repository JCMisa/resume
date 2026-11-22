import "server-only";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { users } from "@/config/schema";

/**
 * The signed-in user's id if they're an admin, otherwise null.
 * The role is read from the DB on every call (never trusted from the client),
 * so a demotion takes effect on the user's very next request.
 */
export async function requireAdmin(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.role === "admin" ? userId : null;
}
