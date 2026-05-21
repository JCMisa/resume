"use server";

import { auth } from "@clerk/nextjs/server";
import { users } from "@/config/schema";
import { eq } from "drizzle-orm";
import { db } from "@/config/db";

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
