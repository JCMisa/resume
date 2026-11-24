"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, Crown, Eye, History, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import ResumeDocument from "@/components/resume-templates/ResumeDocument";
import ScaledPage from "@/components/resume-templates/ScaledPage";
import {
  deleteResumeVersionAction,
  getResumeVersionAction,
  listResumeVersionsAction,
  restoreResumeVersionAction,
  saveResumeVersionAction,
} from "@/lib/actions/resume-versions";
import { resolveTemplate, type TemplateId } from "@/lib/resume-templates";
import {
  AUTO_VERSION_MINUTES,
  MAX_VERSIONS,
  VERSION_LABEL_MAX,
  groupVersionsByDay,
  versionName,
  type VersionListItem,
} from "@/lib/resume-versions";
import type { ResumeContent } from "@/lib/resume-sanitize";

type Doc = { title: string; templateId: TemplateId; content: ResumeContent };

/** Version history panel (Pro): save a named version, preview, restore, delete. */
export default function VersionHistory({
  resumeId,
  isPro,
  open,
  saveNow,
  onRestored,
  onLocked,
}: {
  resumeId: string;
  isPro: boolean;
  /** Reload the list each time the panel opens */
  open: boolean;
  /** Flush unsaved edits first, so versions include them */
  saveNow: () => Promise<unknown>;
  onRestored: (doc: Doc) => void;
  onLocked: () => void;
}) {
  const [versions, setVersions] = useState<VersionListItem[] | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<(Doc & { id: string; name: string }) | null>(null);

  const load = useCallback(async () => {
    const res = await listResumeVersionsAction(resumeId);
    if (res.success) setVersions(res.data.versions);
    else toast.error(res.error);
  }, [resumeId]);

  useEffect(() => {
    if (!open || !isPro) return;
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [open, isPro, load]);

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-dashed p-5 text-center space-y-3">
        <div className="mx-auto size-10 rounded-xl bg-brand/10 flex items-center justify-center">
          <History className="size-5 text-brand-strong dark:text-brand" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black flex items-center justify-center gap-1.5">
            Version history <Crown className="size-3.5 text-amber-500" />
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Go back to any earlier version of this resume. Versions are saved automatically while you edit, and you can
            name your own (like &quot;Sent to Acme&quot;).
          </p>
        </div>
        <Button size="sm" className="rounded-lg font-bold" onClick={onLocked}>
          Upgrade to Pro
        </Button>
      </div>
    );
  }

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch {
      toast.error("Something went wrong. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  const saveVersion = () =>
    run("save", async () => {
      await saveNow();
      const res = await saveResumeVersionAction(resumeId, label);
      if (!res.success) return void toast.error(res.error);
      setLabel("");
      toast.success("Version saved.");
      await load();
    });

  const openPreview = (v: VersionListItem) =>
    run(`preview:${v.id}`, async () => {
      const res = await getResumeVersionAction(resumeId, v.id);
      if (!res.success) return void toast.error(res.error);
      setPreview({ ...res.data, id: v.id, name: versionName(v) });
    });

  const restore = (id: string) =>
    run(`restore:${id}`, async () => {
      await saveNow();
      const res = await restoreResumeVersionAction(resumeId, id);
      if (!res.success) return void toast.error(res.error);
      onRestored(res.data);
      setPreview(null);
      toast.success("Version restored. Your previous state is saved as \"Before restoring\".");
      await load();
    });

  const remove = (id: string) =>
    run(`delete:${id}`, async () => {
      const res = await deleteResumeVersionAction(resumeId, id);
      if (!res.success) return void toast.error(res.error);
      setVersions((list) => list?.filter((v) => v.id !== id) ?? null);
    });

  const time = (d: Date) => new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Saved automatically about every {AUTO_VERSION_MINUTES} minutes while you edit. The last {MAX_VERSIONS} are kept.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void saveVersion();
          }}
        >
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={VERSION_LABEL_MAX}
            placeholder='Name (optional), e.g. "Sent to Acme"'
            aria-label="Version name"
            className="rounded-xl h-9 text-xs"
          />
          <Button type="submit" size="sm" className="rounded-xl h-9 gap-1.5 font-bold shrink-0" disabled={busy !== null}>
            {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />} Save version
          </Button>
        </form>
      </div>

      {versions === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : versions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          No versions yet. Keep editing, or save one now.
        </p>
      ) : (
        groupVersionsByDay(versions).map((g) => (
          <section key={g.day} className="space-y-1.5">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{g.day}</h3>
            <ul className="space-y-1.5">
              {g.items.map((v) => (
                <li key={v.id} className="rounded-xl border p-2.5 flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-bold truncate", v.kind === "manual" && "text-primary")}>
                      {v.kind === "manual" && <Bookmark className="inline size-3 mr-1 -mt-0.5" />}
                      {versionName(v)}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {time(v.createdAt)} · {v.title}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7" title="Preview" aria-label="Preview" disabled={busy !== null} onClick={() => void openPreview(v)}>
                    {busy === `preview:${v.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" title="Restore" aria-label="Restore" disabled={busy !== null} onClick={() => void restore(v.id)}>
                    {busy === `restore:${v.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 text-destructive hover:bg-destructive/10" title="Delete" aria-label="Delete version" disabled={busy !== null} onClick={() => void remove(v.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>{preview?.title} · a preview; nothing changes until you restore it.</DialogDescription>
          </DialogHeader>
          {preview && (
            <>
              <div className="rounded-xl bg-stone-100 dark:bg-stone-900/60 p-3">
                <ScaledPage pageBreaks={false}>
                  <ResumeDocument content={preview.content} template={resolveTemplate(preview.templateId)} />
                </ScaledPage>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setPreview(null)}>
                  Close
                </Button>
                <Button className="rounded-xl gap-1.5 font-bold" disabled={busy !== null} onClick={() => void restore(preview.id)}>
                  {busy === `restore:${preview.id}` ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Restore this version
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
