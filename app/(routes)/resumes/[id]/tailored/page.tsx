import { notFound, redirect } from "next/navigation";
import { getTailoredResumeAction } from "@/lib/actions/resume-tailor";
import { currentUserIsPro } from "@/lib/plan-tier";
import TailoredResult from "./TailoredResult";
import TailoredReviewStep from "./TailoredReviewStep";

export const metadata = { title: "Tailored resume · ResuMe" };

// Result of "Tailor to a job": the before/after score, what changed, the PDF
// in the viewer, downloads. A tailored resume that wasn't finished (the user
// left at the review step) shows the review step here instead.
export default async function TailoredResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [res, isPro] = await Promise.all([getTailoredResumeAction(id), currentUserIsPro()]);
  if (!res.success) notFound();
  const r = res.data;
  // Not made by Tailor to a job: its normal page
  if (!r.tailoredFor || r.status !== "created") redirect(`/resumes/${r.id}`);

  if (r.tailoredFor.stage === "review") {
    return (
      <TailoredReviewStep
        isPro={isPro}
        data={{
          id: r.id,
          jobTitle: r.tailoredFor.jobTitle,
          company: r.tailoredFor.company,
          templateId: r.templateId,
          score: r.tailoredFor.score,
          keywords: r.tailoredFor.keywords,
          suggestedSkills: r.tailoredFor.suggestedSkills,
        }}
      />
    );
  }

  return (
    <TailoredResult
      resume={{ id: r.id, title: r.title, templateId: r.templateId, content: r.content }}
      tailoredFor={r.tailoredFor}
      sourceTitle={r.sourceTitle}
      isPro={isPro}
    />
  );
}
