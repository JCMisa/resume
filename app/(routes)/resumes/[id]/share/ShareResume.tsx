"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Copy,
  Crown,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FileType2,
  Globe,
  Link2,
  Loader2,
  Mail,
  QrCode,
  RefreshCw,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import UpgradeModal from "@/components/custom/UpgradeModal";
import ResumeDocument from "@/components/resume-templates/ResumeDocument";
import ScaledPage from "@/components/resume-templates/ScaledPage";
import { downloadResumeDocx, downloadResumePdf, downloadResumeText } from "@/components/resume-templates/downloads";
import { regenerateShareLinkAction, updateShareSettingsAction } from "@/lib/actions/resume-share";
import { resolveTemplate, type TemplateId } from "@/lib/resume-templates";
import { fileSlug, publicContent, resumeToPlainText, shareTargets } from "@/lib/resume-share";
import type { ResumeContent } from "@/lib/resume-sanitize";

type Share = { shareCode: string | null; shareEnabled: boolean; shareHideContact: boolean; shareViews: number };

const STEPS = ["Choose a template", "Write your resume", "Download & share"];

function Card({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center">
          <Icon className="size-5 text-brand-strong dark:text-brand" />
        </div>
        <div>
          <h2 className="font-black tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// Brand marks as simple letters/glyphs (no third-party icon scripts)
const SOCIAL = [
  { id: "linkedin", label: "LinkedIn", short: "in" },
  { id: "x", label: "X", short: "𝕏" },
  { id: "facebook", label: "Facebook", short: "f" },
  { id: "whatsapp", label: "WhatsApp", short: "WA" },
] as const;

export default function ShareResume({
  resumeId,
  title,
  templateId,
  content,
  initialShare,
  isPro,
}: {
  resumeId: string;
  title: string;
  templateId: TemplateId;
  content: ResumeContent;
  initialShare: Share;
  isPro: boolean;
}) {
  const template = resolveTemplate(templateId);
  const [share, setShare] = useState<Share>(initialShare);
  const [busy, setBusy] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "text" | null>(null);
  const [upgrade, setUpgrade] = useState<"word" | "views" | null>(null);
  const setUpgradeOpen = (open: boolean) => setUpgrade(open ? "word" : null);
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOrigin(window.location.origin), 0);
    return () => clearTimeout(t);
  }, []);

  const url = share.shareCode && origin ? `${origin}/r/${share.shareCode}` : "";
  const live = share.shareEnabled && Boolean(url);
  const name = content.personalDetails?.name?.trim() || title;
  const shareTitle = `${name} · Resume`;
  const targets = url ? shareTargets(url, shareTitle) : null;

  // QR code for the live link (made in the browser)
  useEffect(() => {
    let cancelled = false;
    if (!live) {
      const t = setTimeout(() => setQr(null), 0);
      return () => clearTimeout(t);
    }
    QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: "M" })
      .then((data) => !cancelled && setQr(data))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [live, url]);

  async function run<T>(key: string, fn: () => Promise<T>) {
    setBusy(key);
    try {
      return await fn();
    } finally {
      setBusy(null);
    }
  }

  async function updateShare(changes: { enabled?: boolean; hideContact?: boolean }) {
    await run(changes.enabled !== undefined ? "enabled" : "hide", async () => {
      const res = await updateShareSettingsAction(resumeId, changes);
      if (!res.success) return toast.error(res.error);
      setShare(res.data);
      if (changes.enabled === true) toast.success("Your resume has a public link now.");
      if (changes.enabled === false) toast.success("Sharing is off. The link no longer works.");
    });
  }

  async function copy(text: string, what: "link" | "text") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
      toast.success(what === "link" ? "Link copied." : "Resume text copied.");
    } catch {
      toast.error("Couldn't copy. Select and copy it manually.");
    }
  }

  async function nativeShare() {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        return; // dismissed
      }
    }
    await copy(url, "link");
  }

  const downloadButton = (key: string, icon: React.ElementType, label: string, hint: string, onClick: () => void, pro = false) => {
    const Icon = icon;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy !== null}
        className="w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
      >
        <div className="size-9 shrink-0 rounded-xl border bg-muted/30 flex items-center justify-center">
          {busy === key ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold flex items-center gap-2">
            {label}
            {pro && !isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <Crown className="size-3" /> Pro
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <Download className="size-4 text-muted-foreground" />
      </button>
    );
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <header className="space-y-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/resumes/${resumeId}/edit`}
            aria-label="Back to the editor"
            className="size-9 shrink-0 rounded-xl border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight truncate">{title}</h1>
            <p className="text-sm text-muted-foreground">Download your resume or share it with a link.</p>
          </div>
        </div>
        <ol className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {STEPS.map((step, i) => (
            <li key={step}>
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5",
                  i === 2 ? "border-primary bg-primary/10" : "text-muted-foreground",
                )}
              >
                <span className={cn("size-5 rounded-full flex items-center justify-center text-[11px]", i === 2 ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  {i < 2 ? <Check className="size-3" /> : 3}
                </span>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] items-start">
        {/* Preview of what's shared (contact details hidden when chosen) */}
        <div className="rounded-3xl border bg-stone-100 dark:bg-stone-900/60 p-3 sm:p-6 order-last lg:order-none">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {live ? "What people see at your link" : "Preview"}
          </p>
          <div className="mx-auto max-w-xl">
            <ScaledPage>
              <ResumeDocument content={live ? publicContent(content, { hideContact: share.shareHideContact }) : content} template={template} />
            </ScaledPage>
          </div>
        </div>

        <div className="space-y-6">
          <Card icon={Download} title="Download" description="Files use your current template and edits.">
            <div className="space-y-2">
              {downloadButton("pdf", FileText, "PDF", "Best for applying: looks the same everywhere", () =>
                void run("pdf", async () => {
                  try {
                    await downloadResumePdf(content, template, title);
                  } catch {
                    toast.error("Couldn't create the PDF. Try again.");
                  }
                }),
              )}
              {downloadButton(
                "docx",
                FileType2,
                "Word (.docx)",
                "Editable in Word or Google Docs",
                () => {
                  if (!isPro) return setUpgradeOpen(true);
                  void run("docx", async () => {
                    const error = await downloadResumeDocx(resumeId, title);
                    if (error) toast.error(error);
                  });
                },
                true,
              )}
              {downloadButton("txt", FileType2, "Plain text (.txt)", "For pasting into job application forms", () => downloadResumeText(content, title))}
            </div>
            <Button variant="ghost" size="sm" className="w-full rounded-lg gap-1.5" onClick={() => void copy(resumeToPlainText(content), "text")}>
              {copied === "text" ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />} Copy resume as text
            </Button>
          </Card>

          <Card icon={Globe} title="Share a link" description="A read-only web page of your resume. Off until you turn it on.">
            <label className="flex items-center justify-between gap-3 rounded-2xl border p-3 cursor-pointer">
              <span>
                <span className="block text-sm font-bold">Public link</span>
                <span className="block text-[11px] text-muted-foreground">Anyone with the link can view and download it.</span>
              </span>
              <Switch
                checked={share.shareEnabled}
                disabled={busy === "enabled"}
                onCheckedChange={(v) => void updateShare({ enabled: v })}
                aria-label="Public link"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-2xl border p-3 cursor-pointer">
              <span>
                <span className="block text-sm font-bold">Hide phone number and address</span>
                <span className="block text-[11px] text-muted-foreground">Your email stays visible so people can reach you.</span>
              </span>
              <Switch
                checked={share.shareHideContact}
                disabled={busy === "hide"}
                onCheckedChange={(v) => void updateShare({ hideContact: v })}
                aria-label="Hide phone number and address"
              />
            </label>

            {live && targets && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex gap-2">
                  <Input readOnly value={url} aria-label="Your resume link" onFocus={(e) => e.currentTarget.select()} className="rounded-xl font-mono text-xs" />
                  <Button variant="outline" className="rounded-lg gap-1.5 shrink-0" onClick={() => void copy(url, "link")}>
                    {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
                    <span className="hidden sm:inline">Copy</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-lg gap-1.5 font-bold" onClick={() => void nativeShare()}>
                    <Share2 className="size-4" /> Share…
                  </Button>
                  {SOCIAL.map((s) => (
                    <a
                      key={s.id}
                      href={targets[s.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg gap-1.5")}
                    >
                      <span className="font-black text-xs" aria-hidden>
                        {s.short}
                      </span>
                      {s.label}
                    </a>
                  ))}
                  <a href={targets.email} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg gap-1.5")}>
                    <Mail className="size-4" /> Email
                  </a>
                </div>

                {/* Views (Pro): real visits, not you or link-preview bots */}
                <div className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 shrink-0 rounded-xl border bg-muted/30 flex items-center justify-center">
                      <Eye className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold flex items-center gap-2">
                        {isPro ? `${share.shareViews.toLocaleString()} view${share.shareViews === 1 ? "" : "s"}` : "Link views"}
                        {!isPro && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            <Crown className="size-3" /> Pro
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isPro ? "Visits to your link, not counting you or link previews. A new link starts from 0." : "See how many times recruiters opened your link."}
                      </p>
                    </div>
                  </div>
                  {!isPro && (
                    <Button variant="outline" size="sm" className="rounded-lg shrink-0" onClick={() => setUpgrade("views")}>
                      Unlock
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-4 rounded-2xl border p-3">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element -- data: URL made in the browser
                    <img src={qr} alt="QR code for your resume link" width={112} height={112} className="rounded-lg bg-white p-1 shrink-0" />
                  ) : (
                    <div className="size-28 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <QrCode className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-2 min-w-0">
                    <p className="text-sm font-bold">QR code</p>
                    <p className="text-[11px] text-muted-foreground">For job fairs, business cards or a printed resume.</p>
                    {qr && (
                      <a href={qr} download={`${fileSlug(title)}-qr.png`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg gap-1.5")}>
                        <Download className="size-4" /> Download
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-lg gap-1.5")}>
                    <ExternalLink className="size-4" /> Open public page
                  </a>
                  <Button variant="ghost" size="sm" className="rounded-lg gap-1.5 text-muted-foreground" onClick={() => setConfirmNew(true)}>
                    <RefreshCw className="size-4" /> New link
                  </Button>
                </div>
              </div>
            )}

            {!share.shareEnabled && share.shareCode && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Link2 className="size-3.5" /> Turning sharing back on reuses your previous link.
              </p>
            )}
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmNew} onOpenChange={setConfirmNew}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a new link?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current link stops working right away, so anyone you sent it to will need the new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                void run("regen", async () => {
                  const res = await regenerateShareLinkAction(resumeId);
                  if (!res.success) return toast.error(res.error);
                  setShare(res.data);
                  toast.success("New link created. The old one no longer works.");
                })
              }
            >
              Create new link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal
        isOpen={upgrade !== null}
        onClose={() => setUpgrade(null)}
        title={upgrade === "views" ? "Link views are a Pro feature" : "Word export is a Pro feature"}
        description={
          upgrade === "views"
            ? "Upgrade to Pro to see how many people opened your resume link. Pro also removes the \"Made with ResuMe\" footer from your public page."
            : "Upgrade to Pro to download an editable Word file of any resume. PDF and plain text stay free."
        }
      />
    </div>
  );
}
