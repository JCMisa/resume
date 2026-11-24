"use server";

import { randomBytes } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { resumes } from "@/config/schema";
import { SHARE_CODE_LENGTH, codeFromBytes } from "@/lib/resume-share";

// Share settings for a built resume. The public page (/r/<code>) only shows a
// resume while sharing is on; regenerating the code kills old links.

const UUID = /^[0-9a-f-]{36}$/i;
const NOT_FOUND = { success: false as const, error: "Resume not found." };

function newCode() {
  // Rejection sampling drops some bytes, so draw plenty
  let code = "";
  while (code.length < SHARE_CODE_LENGTH) code = codeFromBytes(randomBytes(SHARE_CODE_LENGTH * 3));
  return code;
}

const settingsColumns = {
  shareCode: resumes.shareCode,
  shareEnabled: resumes.shareEnabled,
  shareHideContact: resumes.shareHideContact,
  shareViews: resumes.shareViews,
};

export async function getShareSettingsAction(resumeId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in." };
    if (typeof resumeId !== "string" || !UUID.test(resumeId)) return NOT_FOUND;
    const [row] = await db
      .select(settingsColumns)
      .from(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));
    if (!row) return NOT_FOUND;
    return { success: true as const, data: row };
  } catch (error) {
    console.error("Get Share Settings Failure:", error);
    return { success: false as const, error: "Couldn't load sharing settings." };
  }
}

/**
 * Turn sharing on/off and set privacy. Turning it on the first time creates
 * the link code. Only resumes built in the editor can be shared.
 */
export async function updateShareSettingsAction(
  resumeId: string,
  changes: { enabled?: unknown; hideContact?: unknown },
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in." };
    if (typeof resumeId !== "string" || !UUID.test(resumeId)) return NOT_FOUND;

    const owned = and(eq(resumes.id, resumeId), eq(resumes.userId, userId), eq(resumes.status, "created"));
    const [current] = await db.select({ shareCode: resumes.shareCode }).from(resumes).where(owned);
    if (!current) return { success: false as const, error: "Only resumes built in the editor can be shared." };

    const set: Partial<typeof resumes.$inferInsert> = {};
    if (typeof changes?.enabled === "boolean") {
      set.shareEnabled = changes.enabled;
      if (changes.enabled && !current.shareCode) set.shareCode = newCode();
    }
    if (typeof changes?.hideContact === "boolean") set.shareHideContact = changes.hideContact;
    if (!Object.keys(set).length) return { success: false as const, error: "Nothing to change." };

    const [row] = await db.update(resumes).set(set).where(owned).returning(settingsColumns);
    return { success: true as const, data: row };
  } catch (error) {
    console.error("Update Share Settings Failure:", error);
    return { success: false as const, error: "Couldn't update sharing." };
  }
}

/** New link code: anyone with the old link loses access. */
export async function regenerateShareLinkAction(resumeId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in." };
    if (typeof resumeId !== "string" || !UUID.test(resumeId)) return NOT_FOUND;
    const [row] = await db
      .update(resumes)
      .set({ shareCode: newCode(), shareViews: 0 })
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId), eq(resumes.status, "created")))
      .returning(settingsColumns);
    if (!row) return NOT_FOUND;
    return { success: true as const, data: row };
  } catch (error) {
    console.error("Regenerate Share Link Failure:", error);
    return { success: false as const, error: "Couldn't create a new link." };
  }
}
