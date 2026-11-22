"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { jobMatches, resumes, usageEvents } from "@/config/schema";
import { assertAllowed, toActionError } from "@/lib/billing-guard";
import { enforceRateLimit } from "@/lib/arcjet";
import { matchResumeToJob } from "@/lib/job-match-ai";
import { gateJobMatch } from "@/lib/plan-gating";
import { currentUserIsPro } from "@/lib/plan-tier";
import {
  MAX_JOB_DESCRIPTION_CHARS,
  MIN_JOB_DESCRIPTION_CHARS,
  type JobMatchData,
} from "@/lib/job-match";

const MATCH_FAILED_MESSAGE =
  "We couldn't compare your resume with this job right now. Please try again in a moment. This attempt didn't count toward your plan.";

export type JobMatchListItem = {
  id: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  createdAt: Date;
};

// 1. Compare a resume with a pasted job description (metered: "job_match").
export async function createJobMatchAction(
  resumeId: string,
  input: { jobDescription: string; jobTitle?: string; company?: string },
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const jobDescription = (input.jobDescription ?? "").trim();
    if (jobDescription.length < MIN_JOB_DESCRIPTION_CHARS) {
      throw new Error("Paste the full job description (at least a few sentences).");
    }
    if (jobDescription.length > MAX_JOB_DESCRIPTION_CHARS) {
      throw new Error(
        `That job description is too long. Keep it under ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters.`,
      );
    }

    // Load the resume first, so a bad id doesn't cost a rate-limit token
    const [resume] = await db
      .select({ id: resumes.id, content: resumes.content, analysis: resumes.analysis })
      .from(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));
    if (!resume) throw new Error("Resume not found.");

    const billing = await assertAllowed("job_match");
    await enforceRateLimit("job_match", userId, billing.isPro);

    let result: JobMatchData;
    try {
      // Years from the v2 analysis are computed by code; prefer them
      result = await matchResumeToJob(
        resume.content,
        jobDescription,
        resume.analysis?.careerProfile?.yearsExperience ?? null,
      );
    } catch (aiError) {
      console.error("Job Match AI Failure:", aiError);
      throw new Error(MATCH_FAILED_MESSAGE);
    }

    // User-entered title/company win over what the AI extracted
    const jobTitle = (input.jobTitle?.trim() || result.jobTitle).slice(0, 120);
    const company = (input.company?.trim() || result.company).slice(0, 120);

    const [[match]] = await db.batch([
      db
        .insert(jobMatches)
        .values({
          userId,
          resumeId,
          jobTitle,
          company,
          jobDescription,
          matchScore: result.matchScore,
          result: { ...result, jobTitle, company },
        })
        .returning(),
      db.insert(usageEvents).values({ userId, kind: "job_match", resumeId }),
    ]);

    // Free users get the Free view (tailored summary/bullets stay server-side)
    return {
      success: true as const,
      data: { ...match, result: gateJobMatch(match.result, billing.isPro) },
    };
  } catch (error) {
    console.error("Create Job Match Failure:", error);
    return toActionError(error, "Failed to compare your resume with this job.");
  }
}

// 2. Matches for one resume (newest first), without the heavy result JSON.
export async function listJobMatchesAction(resumeId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const data: JobMatchListItem[] = await db
      .select({
        id: jobMatches.id,
        jobTitle: jobMatches.jobTitle,
        company: jobMatches.company,
        matchScore: jobMatches.matchScore,
        createdAt: jobMatches.createdAt,
      })
      .from(jobMatches)
      .where(and(eq(jobMatches.resumeId, resumeId), eq(jobMatches.userId, userId)))
      .orderBy(desc(jobMatches.createdAt))
      .limit(50);

    return { success: true as const, data };
  } catch (error) {
    console.error("List Job Matches Failure:", error);
    return { success: false as const, error: "Failed to load your job matches." };
  }
}

// 3. One full match report.
export async function getJobMatchAction(matchId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const [match] = await db
      .select()
      .from(jobMatches)
      .where(and(eq(jobMatches.id, matchId), eq(jobMatches.userId, userId)));
    if (!match) return { success: false as const, error: "Job match not found." };

    return {
      success: true as const,
      data: { ...match, result: gateJobMatch(match.result, await currentUserIsPro()) },
    };
  } catch (error) {
    console.error("Get Job Match Failure:", error);
    return { success: false as const, error: "Failed to load this job match." };
  }
}

// 4. Delete a match (its usage stays counted).
export async function deleteJobMatchAction(matchId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const [deleted] = await db
      .delete(jobMatches)
      .where(and(eq(jobMatches.id, matchId), eq(jobMatches.userId, userId)))
      .returning({ id: jobMatches.id });
    if (!deleted) return { success: false as const, error: "Job match not found." };

    return { success: true as const, data: deleted };
  } catch (error) {
    console.error("Delete Job Match Failure:", error);
    return { success: false as const, error: "Failed to delete this job match." };
  }
}
