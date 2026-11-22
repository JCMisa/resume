"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Briefcase, ChevronDown, History, Loader2, Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import UpgradeModal from "@/components/custom/UpgradeModal";
import { cn } from "@/lib/utils";
import { describeFreeLimit, isLimitReached } from "@/lib/plans";
import {
  MAX_JOB_DESCRIPTION_CHARS,
  MIN_JOB_DESCRIPTION_CHARS,
  type JobMatchData,
} from "@/lib/job-match";
import {
  createJobMatchAction,
  deleteJobMatchAction,
  getJobMatchAction,
  listJobMatchesAction,
  type JobMatchListItem,
} from "@/lib/actions/job-match";
import { ScorePill } from "../ResumeLibrary";
import JobMatchReport from "./JobMatchReport";

function ReportSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading job match">
      <div className="rounded-3xl border bg-card p-5 flex items-center gap-5">
        <Skeleton className="size-28 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}

export default function JobMatchPanel({ resumeId }: { resumeId: string }) {
  const [matches, setMatches] = useState<JobMatchListItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [report, setReport] = useState<JobMatchData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [creating, startCreating] = useTransition();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openMatch = useCallback((id: string) => {
    setSelectedId(id);
    setReportLoading(true);
    getJobMatchAction(id).then((res) => {
      setReportLoading(false);
      if (res.success) setReport(res.data.result);
      else toast.error(res.error);
    });
  }, []);

  // Load history; open the newest match and collapse the form when there is one
  useEffect(() => {
    let cancelled = false;
    listJobMatchesAction(resumeId).then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setMatches([]);
        toast.error(res.error);
        return;
      }
      setMatches(res.data);
      if (res.data.length) {
        setFormOpen(false);
        openMatch(res.data[0].id);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [resumeId, openMatch]);

  const chars = description.trim().length;
  const tooShort = chars < MIN_JOB_DESCRIPTION_CHARS;

  const submit = () => {
    if (tooShort) {
      toast.error("Paste the full job description first.");
      return;
    }
    startCreating(async () => {
      const res = await createJobMatchAction(resumeId, {
        jobDescription: description,
        jobTitle,
        company,
      });
      if (!res.success) {
        if (isLimitReached(res)) setUpgradeOpen(true);
        else toast.error(res.error);
        return;
      }
      const m = res.data;
      setMatches((prev) => [
        { id: m.id, jobTitle: m.jobTitle, company: m.company, matchScore: m.matchScore, createdAt: m.createdAt },
        ...(prev ?? []),
      ]);
      setSelectedId(m.id);
      setReport(m.result);
      setFormOpen(false);
      setJobTitle("");
      setCompany("");
      setDescription("");
      toast.success(`Match score: ${m.matchScore}/100`);
    });
  };

  const remove = async (id: string) => {
    const res = await deleteJobMatchAction(id);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    const rest = (matches ?? []).filter((m) => m.id !== id);
    setMatches(rest);
    if (selectedId === id) {
      setReport(null);
      setSelectedId(null);
      if (rest.length) openMatch(rest[0].id);
      else setFormOpen(true);
    }
  };

  return (
    <div className="@container w-full space-y-4">
      {/* New match form */}
      <section className="rounded-3xl border bg-card shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          aria-expanded={formOpen}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15">
              {matches?.length ? <Plus className="size-4" /> : <Target className="size-4" />}
            </span>
            <span>
              <span className="block text-sm font-black tracking-tight">
                {matches?.length ? "Match against another job" : "Match this resume to a job"}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Paste a job posting to see your match score, missing keywords and tailored rewrites
              </span>
            </span>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", formOpen && "rotate-180")} />
        </button>

        {formOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="border-t p-5 space-y-4"
          >
            <div className="grid gap-3 @lg:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="jm-title" className="text-xs font-bold">
                  Job title <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input id="jm-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={120} placeholder="e.g. Senior Frontend Engineer" disabled={creating} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="jm-company" className="text-xs font-bold">
                  Company <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input id="jm-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} placeholder="e.g. Globex" disabled={creating} />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="jm-desc" className="text-xs font-bold">
                  Job description
                </label>
                <span className={cn("text-[11px] tabular-nums", chars > MAX_JOB_DESCRIPTION_CHARS ? "text-destructive" : "text-muted-foreground")}>
                  {chars.toLocaleString()} / {MAX_JOB_DESCRIPTION_CHARS.toLocaleString()}
                </span>
              </div>
              <Textarea
                id="jm-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the whole posting: responsibilities, requirements and nice-to-haves."
                className="min-h-48 max-h-96"
                disabled={creating}
              />
            </div>
            <div className="flex flex-col @lg:flex-row @lg:items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Uses one job match from your plan. The posting is stored with the result so you can revisit it.
              </p>
              <Button type="submit" disabled={creating || tooShort || chars > MAX_JOB_DESCRIPTION_CHARS} className="rounded-xl font-bold gap-1.5 shrink-0">
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
                {creating ? "Comparing… (about 5 seconds)" : "Compare with this job"}
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* History */}
      {matches === null ? (
        <Skeleton className="h-24 rounded-3xl" />
      ) : matches.length > 0 ? (
        <section className="rounded-3xl border bg-card shadow-sm overflow-hidden">
          <header className="flex items-center gap-2.5 px-5 py-3 border-b">
            <History className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-black tracking-tight">Past matches</h3>
            <span className="text-[11px] text-muted-foreground tabular-nums">{matches.length}</span>
          </header>
          <ul className="divide-y max-h-56 overflow-y-auto custom-scrollbar">
            {matches.map((m) => (
              <li key={m.id} className={cn("flex items-center gap-2 pr-2", selectedId === m.id && "bg-brand/5")}>
                <button
                  type="button"
                  onClick={() => openMatch(m.id)}
                  aria-current={selectedId === m.id ? "true" : undefined}
                  className="flex-1 min-w-0 flex items-center gap-3 px-5 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <Briefcase className={cn("size-4 shrink-0", selectedId === m.id ? "text-brand-strong dark:text-brand" : "text-muted-foreground")} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">
                      {m.jobTitle || "Untitled role"}
                      {m.company && <span className="text-muted-foreground font-normal"> · {m.company}</span>}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                  <ScorePill score={m.matchScore} />
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                  aria-label={`Delete match for ${m.jobTitle || "this role"}`}
                  onClick={() => remove(m.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Report */}
      {creating ? (
        <ReportSkeleton />
      ) : reportLoading ? (
        <ReportSkeleton />
      ) : report ? (
        <JobMatchReport data={report} />
      ) : null}

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Job match limit reached"
        description={`Free plans include ${describeFreeLimit("job_match")}. Upgrade to Pro for unlimited job matches.`}
      />
    </div>
  );
}
