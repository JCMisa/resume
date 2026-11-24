import { listStarterResumesAction } from "@/lib/actions/resume-editor";
import { getUserBillingStatus } from "@/lib/actions/billing";
import { FREE_LIMITS } from "@/lib/plans";
import CreateResumeStart from "./_components/CreateResumeStart";

export const metadata = { title: "Create resume · ResuMe" };

// Step 1 of the builder: pick a template, start blank or from an existing
// resume. Creating opens the editor (/resumes/[id]/edit).
export default async function CreateResumePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ from }, starters, billing] = await Promise.all([
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
    />
  );
}
