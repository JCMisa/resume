"use client";

import { useState } from "react";
import { Check, Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ResumeContent } from "@/lib/resume-sanitize";
import type { TemplateDef } from "@/lib/resume-templates";
import { downloadResumePdf } from "@/components/resume-templates/downloads";

/** Viewer actions on a shared resume: download the PDF, share/copy the link. */
export default function PublicResumeActions({
  content,
  template,
  title,
  name,
}: {
  content: ResumeContent;
  template: TemplateDef;
  title: string;
  name: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} · Resume`, url });
        return;
      } catch {
        // dismissed: fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={() => void share()}>
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
        <span className="hidden sm:inline">Share</span>
      </Button>
      <Button
        size="sm"
        className="rounded-lg gap-1.5 font-bold"
        disabled={downloading}
        onClick={async () => {
          setDownloading(true);
          try {
            await downloadResumePdf(content, template, title);
          } catch {
            toast.error("Couldn't create the PDF. Try again.");
          } finally {
            setDownloading(false);
          }
        }}
      >
        {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
        PDF
      </Button>
    </div>
  );
}
