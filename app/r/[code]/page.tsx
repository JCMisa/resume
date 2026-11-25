import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { after } from "next/server";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { FileX2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ResumeDocument from "@/components/resume-templates/ResumeDocument";
import ScaledPage from "@/components/resume-templates/ScaledPage";
import { getPublicResume, recordShareView } from "@/lib/public-resume";
import { userIsPro } from "@/lib/owner-plan";
import { headline, isLikelyBot } from "@/lib/resume-share";
import PublicResumeActions from "./PublicResumeActions";

// Public view of a shared resume. Lives outside the app shell (no sidebar),
// is public in proxy.ts, and is kept out of search engines.

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const resume = await getPublicResume(code);
  const robots = { index: false, follow: false };
  if (!resume) return { title: "Resume not available", robots };
  const name = resume.content.personalDetails?.name?.trim() || resume.title;
  const description = headline(resume.content) || "Resume shared with ResuMe";
  return {
    title: `${name} · Resume`,
    description,
    robots,
    openGraph: { title: `${name} · Resume`, description, type: "profile" },
    twitter: { card: "summary_large_image", title: `${name} · Resume`, description },
  };
}

export default async function PublicResumePage({ params }: Props) {
  const { code } = await params;
  const resume = await getPublicResume(code);

  if (!resume) {
    return (
      <main className="min-h-svh flex items-center justify-center bg-stone-100 dark:bg-stone-950 p-4">
        <div className="max-w-sm w-full rounded-3xl border bg-card p-8 text-center space-y-4">
          <div className="mx-auto size-12 rounded-2xl bg-muted flex items-center justify-center">
            <FileX2 className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black">This resume isn&apos;t available</h1>
            <p className="text-sm text-muted-foreground">
              The link may be old, or its owner stopped sharing it. Ask them for a new link.
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "rounded-lg")}>
            Go to ResuMe
          </Link>
        </div>
      </main>
    );
  }

  // Count real visits only: not the owner, not link-preview bots
  const [{ userId }, ua, ownerPro] = await Promise.all([
    auth(),
    headers().then((h) => h.get("user-agent")),
    // Pro owners get a clean page: no "Made with ResuMe" footer
    userIsPro(resume.ownerId),
  ]);
  if (userId !== resume.ownerId && !isLikelyBot(ua)) after(() => recordShareView(resume.id));

  const name = resume.content.personalDetails?.name?.trim() || resume.title;

  return (
    <div className="min-h-svh flex flex-col bg-stone-100 dark:bg-stone-950">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-5xl h-14 px-3 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" aria-label="ResuMe home" className="shrink-0">
              <Image src="/logo.svg" alt="" width={24} height={24} />
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-black truncate">{name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{headline(resume.content) || "Resume"}</p>
            </div>
          </div>
          <PublicResumeActions content={resume.content} template={resume.template} title={resume.title} name={name} />
        </div>
      </header>

      <main className="flex-1 px-2 sm:px-6 py-4 sm:py-8">
        <div className="mx-auto max-w-205">
          <ScaledPage pageBreaks={false}>
            <ResumeDocument content={resume.content} template={resume.template} />
          </ScaledPage>
        </div>
      </main>

      {ownerPro ? (
        <div className="py-4" />
      ) : (
        <footer className="py-6 text-center text-xs text-muted-foreground">
          Made with{" "}
          <Link href="/" className="font-bold text-foreground hover:underline">
            ResuMe
          </Link>{" "}
          · Build an ATS-friendly resume for free
        </footer>
      )}
    </div>
  );
}
