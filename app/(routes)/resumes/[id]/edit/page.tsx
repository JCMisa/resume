import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, UploadCloud } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getResumeForEditorAction } from "@/lib/actions/resume-editor";
import { getUserBillingStatus } from "@/lib/actions/billing";
import { FREE_LIMITS } from "@/lib/plans";
import ResumeEditor from "../../_components/editor/ResumeEditor";

export const metadata = { title: "Edit resume · ResuMe" };

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [res, billing] = await Promise.all([getResumeForEditorAction(id), getUserBillingStatus()]);
  if (!res.success) notFound();
  const resume = res.data;

  // Uploaded resumes keep their analyzed content; edit a copy instead
  if (resume.status !== "created") {
    return (
      <div className="w-full flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border bg-card p-8 text-center space-y-4">
          <div className="mx-auto size-12 rounded-2xl bg-brand/10 flex items-center justify-center">
            <UploadCloud className="size-6 text-brand-strong dark:text-brand" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black">This is an uploaded resume</h1>
            <p className="text-sm text-muted-foreground">
              Its AI report is based on the file you uploaded, so it isn&apos;t edited directly. Make an editable copy in
              the builder instead; the original and its report stay as they are.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href={`/resumes/create?from=${resume.id}`} className={cn(buttonVariants(), "rounded-xl font-bold gap-1.5")}>
              <Copy className="size-4" /> Make an editable copy
            </Link>
            <Link href={`/resumes/${resume.id}`} className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}>
              Back to report
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResumeEditor
      resumeId={resume.id}
      initial={{ title: resume.title, templateId: resume.templateId, content: resume.content }}
      ai={{
        isPro: billing.isPro,
        // null = unlimited (Pro/admin)
        remaining: billing.isPro ? null : Math.max(0, FREE_LIMITS.ai_write - billing.limits.aiWrites),
      }}
    />
  );
}
