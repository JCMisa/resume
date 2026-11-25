import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, UploadCloud } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getResumeForEditorAction } from "@/lib/actions/resume-editor";
import { getShareSettingsAction } from "@/lib/actions/resume-share";
import { currentUserIsPro } from "@/lib/plan-tier";
import ShareResume from "./ShareResume";

export const metadata = { title: "Download & share" };

// Step 3 of the builder: downloads (PDF / Word / text) and the public link.
export default async function ShareResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [resume, share, isPro] = await Promise.all([getResumeForEditorAction(id), getShareSettingsAction(id), currentUserIsPro()]);
  if (!resume.success || !share.success) notFound();

  if (resume.data.status !== "created") {
    return (
      <div className="w-full flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border bg-card p-5 sm:p-8 text-center space-y-4">
          <div className="mx-auto size-12 rounded-2xl bg-brand/10 flex items-center justify-center">
            <UploadCloud className="size-6 text-brand-strong dark:text-brand" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black">Share a copy built in the editor</h1>
            <p className="text-sm text-muted-foreground">
              Uploaded resumes keep your original file. Make an editable copy to choose a template, download it, and
              share a link.
            </p>
          </div>
          <Link href={`/resumes/create?from=${id}`} className={cn(buttonVariants(), "rounded-lg font-bold gap-1.5")}>
            <Copy className="size-4" /> Make an editable copy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ShareResume
      resumeId={id}
      title={resume.data.title}
      templateId={resume.data.templateId}
      content={resume.data.content}
      initialShare={share.data}
      isPro={isPro}
    />
  );
}
