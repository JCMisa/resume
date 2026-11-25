import { listStarterResumesAction } from "@/lib/actions/resume-editor";
import { getUserBillingStatus } from "@/lib/actions/billing";
import { FREE_LIMITS, PRO_LIMITS } from "@/lib/plans";
import CreateResumeStart from "./_components/CreateResumeStart";

export const metadata = { title: "Create resume · ResuMe" };

// Step 1 of the builder: pick a template, start blank or from an existing
// resume (opens the editor), or "Tailor to a job" (?mode=tailor): upload or
// pick a resume + a job description -> a tailored copy.
export default async function CreateResumePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; mode?: string }>;
}) {
  const [{ from, mode }, starters, billing] = await Promise.all([
    searchParams,
    listStarterResumesAction(),
    getUserBillingStatus(),
  ]);

  const resumes = starters.success ? starters.data : [];
  const buildsLeft = billing.isPro ? null : Math.max(0, FREE_LIMITS.create_resume - billing.limits.resumes);

  return (
    <CreateResumeStart
      resumes={resumes}
      initialFrom={resumes.some((r) => r.id === from) ? from! : null}
      buildsLeft={buildsLeft}
      allowed={billing.allowed.create_resume}
      initialMode={mode === "tailor" ? "tailor" : "build"}
      tailorUsage={{
        allowed: billing.allowed.resume_tailor,
        isPro: billing.isPro,
        // Free: 3 in total, ever; Pro: 30 a month; admins: unlimited
        used: billing.isPro ? billing.limits.tailorsThisMonth : billing.limits.tailors,
        limit: billing.isAdmin ? null : billing.isPro ? PRO_LIMITS.resume_tailor : FREE_LIMITS.resume_tailor,
        period: billing.isPro ? "monthly" : "lifetime",
      }}
    />
  );
}
