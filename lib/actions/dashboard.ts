/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { resumes, interviews, interviewResults } from "@/config/schema";
import { eq, desc } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";

export async function getDashboardTelemetryAction() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized workspace access.");

    // 1. Gather baseline metadata collections
    const userResumes = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.updatedAt));

    const userInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(desc(interviews.createdAt));

    // 2. Extract and format chronological line data tracking ATS Score progression
    // We only collect records where a valid Gemini AI score analysis exists
    const scoreHistory = userResumes
      .filter((r) => r.analysis?.overallScore !== undefined)
      .map((r) => ({
        date: new Date(r.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: r.analysis?.overallScore || 0,
        title: r.title,
      }))
      .reverse(); // Chronological timeline order

    // 3. Aggregate mock interview dimension scores for Radar chart mappings
    const allResults = await db
      .select({
        score: interviewResults.overallScore,
        suggestions: interviewResults.suggestions,
      })
      .from(interviewResults)
      .innerJoin(interviews, eq(interviewResults.interviewId, interviews.id)) // get interview results linked to the user's interviews
      .where(eq(interviews.userId, userId));

    // Flatten and average radar segment dimensions (Communication, Technical Depth, etc.)
    const categoryTotals: Record<string, { sum: number; count: number }> = {};
    allResults.forEach((res) => {
      if (res.suggestions && Array.isArray(res.suggestions)) {
        res.suggestions.forEach((s: any) => {
          if (!categoryTotals[s.category]) {
            categoryTotals[s.category] = { sum: 0, count: 0 };
          }
          categoryTotals[s.category].sum += s.score || 0;
          categoryTotals[s.category].count += 1;
        });
      }
    });

    const skillRadarData = Object.keys(categoryTotals).map((cat) => ({
      subject: cat,
      value: Math.round(categoryTotals[cat].sum / categoryTotals[cat].count),
    }));

    // Default structural fallback tracking metrics if no recordings exist yet
    const fallbackRadar = [
      { subject: "Communication", value: 0 },
      { subject: "Technical Depth", value: 0 },
      { subject: "Confidence", value: 0 },
      { subject: "Clarity", value: 0 },
    ];

    // 4. Calculate high-level metrics safely
    const totalResumesBuilt = userResumes.length;
    // Only graded sessions (excludes cancelled "failed" and abandoned "in-progress" ones)
    const totalInterviewsDone = userInterviews.filter(
      (i) => i.status === "completed",
    ).length;

    const validScores = userResumes
      .filter((r) => r.analysis?.overallScore)
      .map((r) => r.analysis!.overallScore);
    const highestATS = validScores.length > 0 ? Math.max(...validScores) : 0;

    const interviewScores = allResults
      .filter((r) => r.score !== null)
      .map((r) => r.score!);
    const averageInterviewScore =
      interviewScores.length > 0
        ? Math.round(
            interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length,
          )
        : 0;

    // 5. Compute a unified Career Readiness Matrix score matching your brand design patterns
    const careerReadyIndex =
      Math.round(highestATS * 0.5 + averageInterviewScore * 0.5) || 0;

    return {
      success: true,
      data: {
        metrics: {
          resumesCount: totalResumesBuilt,
          interviewsCount: totalInterviewsDone,
          topAts: highestATS,
          avgInterview: averageInterviewScore,
          readinessIndex: careerReadyIndex,
        },
        scoreTimeline: scoreHistory,
        radarSkills: skillRadarData.length > 0 ? skillRadarData : fallbackRadar,
        recentDocuments: userResumes.slice(0, 3).map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          score: r.analysis?.overallScore || null,
          date: r.updatedAt,
        })),
      },
    };
  } catch (error: any) {
    // Let Next.js handle its own control-flow errors (e.g. the dynamic-rendering
    // bailout from auth()/headers() during build) instead of logging them as failures
    unstable_rethrow(error);
    console.error("Dashboard calculation pipeline failure:", error);
    return {
      success: false,
      error: error.message || "Failed to parse system metrics.",
    };
  }
}
