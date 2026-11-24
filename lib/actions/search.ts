"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, ilike, isNotNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { interviewResults, interviews, resumes } from "@/config/schema";
import { containsPattern } from "@/lib/admin";
import { SEARCH_RESULT_LIMIT, isSearchable, normalizeSearchQuery } from "@/lib/search";

/**
 * Header search: the signed-in user's own resumes (title/category) and
 * interviews (role). Only ids, titles and scores are returned; never resume
 * content or report data.
 */
export async function searchAppAction(rawQuery: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in." };

    const query = normalizeSearchQuery(rawQuery);
    if (!isSearchable(query)) {
      return { success: true as const, data: { query, resumes: [], interviews: [] } };
    }
    const pattern = containsPattern(query);

    const [resumeRows, interviewRows] = await Promise.all([
      db
        .select({
          id: resumes.id,
          title: resumes.title,
          category: resumes.category,
          status: resumes.status,
          score: sql<number | null>`round((${resumes.analysis}->>'overallScore')::numeric)::int`,
          updatedAt: resumes.updatedAt,
        })
        .from(resumes)
        .where(
          and(
            eq(resumes.userId, userId),
            or(ilike(resumes.title, pattern), ilike(resumes.category, pattern)),
          ),
        )
        .orderBy(desc(resumes.updatedAt))
        .limit(SEARCH_RESULT_LIMIT),
      db
        .select({
          id: interviews.id,
          jobRole: interviews.jobRole,
          status: interviews.status,
          score: interviewResults.overallScore,
          createdAt: interviews.createdAt,
        })
        .from(interviews)
        .leftJoin(interviewResults, eq(interviewResults.interviewId, interviews.id))
        .where(
          and(
            eq(interviews.userId, userId),
            ilike(interviews.jobRole, pattern),
            // Graded, or answers saved and waiting for a grading retry;
            // never failed/abandoned sessions
            ne(interviews.status, "failed"),
            or(eq(interviews.status, "completed"), isNotNull(interviews.transcript)),
          ),
        )
        .orderBy(desc(interviews.createdAt))
        .limit(SEARCH_RESULT_LIMIT),
    ]);

    return {
      success: true as const,
      data: { query, resumes: resumeRows, interviews: interviewRows },
    };
  } catch (error) {
    console.error("App Search Failure:", error);
    return { success: false as const, error: "Search failed. Try again." };
  }
}
