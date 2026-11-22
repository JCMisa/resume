"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  AtsCheck,
  BulletAuditItem,
  BulletRating,
  CheckStatus,
  RedFlag,
  SubScores,
} from "@/lib/analysis-types";

// ── Shared bits ─────────────────────────────────────────────────────────────

export function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl border bg-card shadow-sm p-5 space-y-4 min-w-0", className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15 shrink-0">
              <Icon className="size-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-black tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Score tone (status colors always paired with a number/label, never color alone). */
export const scoreTone = (n: number) =>
  n >= 80 ? "good" : n >= 60 ? "fair" : "poor";

const TONE_TEXT = {
  good: "text-brand-strong dark:text-brand",
  fair: "text-amber-600 dark:text-amber-400",
  poor: "text-rose-600 dark:text-rose-400",
} as const;
const TONE_BAR = {
  good: "bg-brand",
  fair: "bg-amber-500",
  poor: "bg-rose-500",
} as const;

export function ScoreRing({ score, size = 112 }: { score: number; size?: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const tone = scoreTone(score);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          className={cn(
            "transition-[stroke-dashoffset] duration-700",
            tone === "good" ? "stroke-brand" : tone === "fair" ? "stroke-amber-500" : "stroke-rose-500",
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tabular-nums leading-none">{score}</span>
        <span className="text-[10px] font-bold text-muted-foreground mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ── Sub-scores ──────────────────────────────────────────────────────────────

const SUBSCORE_INFO: Record<keyof SubScores, { label: string; hint: string; source: string }> = {
  atsParseability: {
    label: "ATS parseability",
    hint: "Can tracking systems read your contact info, sections and dates?",
    source: "Checked",
  },
  impact: {
    label: "Impact",
    hint: "Results and scope shown, and how many bullets include numbers",
    source: "AI + checked",
  },
  keywords: {
    label: "Keywords",
    hint: "Skills and terms recruiters search for in your target role",
    source: "AI",
  },
  clarity: {
    label: "Clarity",
    hint: "Concise, specific, consistent writing",
    source: "AI + checked",
  },
  completeness: {
    label: "Completeness",
    hint: "Core sections filled in",
    source: "Checked",
  },
};

export function SubScoreBars({ scores, weights }: { scores: SubScores; weights: Record<keyof SubScores, number> }) {
  const keys = Object.keys(SUBSCORE_INFO) as (keyof SubScores)[];
  return (
    <ul className="space-y-3.5">
      {keys.map((k) => {
        const v = scores[k];
        const tone = scoreTone(v);
        const info = SUBSCORE_INFO[k];
        return (
          <li key={k} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-bold">
                {info.label}{" "}
                <span className="text-[10px] font-semibold text-muted-foreground">
                  · {Math.round(weights[k] * 100)}% of score · {info.source}
                </span>
              </p>
              <span className={cn("text-sm font-black tabular-nums", TONE_TEXT[tone])}>{v}</span>
            </div>
            <div
              className="h-2 rounded-full bg-muted overflow-hidden"
              role="meter"
              aria-label={info.label}
              aria-valuenow={v}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={cn("h-full rounded-full", TONE_BAR[tone])} style={{ width: `${v}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground">{info.hint}</p>
          </li>
        );
      })}
    </ul>
  );
}

// ── Checks ──────────────────────────────────────────────────────────────────

const STATUS_ICON: Record<CheckStatus, { Icon: React.ElementType; cls: string; label: string }> = {
  pass: { Icon: CheckCircle2, cls: "text-brand-strong dark:text-brand", label: "Pass" },
  warn: { Icon: AlertTriangle, cls: "text-amber-600 dark:text-amber-400", label: "Needs attention" },
  fail: { Icon: XCircle, cls: "text-rose-600 dark:text-rose-400", label: "Fix this" },
};

export function CheckCounts({ checks }: { checks: AtsCheck[] }) {
  const count = (s: CheckStatus) => checks.filter((c) => c.status === s).length;
  return (
    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
      {(["fail", "warn", "pass"] as CheckStatus[]).map((s) => {
        const { Icon, cls, label } = STATUS_ICON[s];
        return (
          <span key={s} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1">
            <Icon className={cn("size-3.5", cls)} />
            <span className="tabular-nums">{count(s)}</span>
            <span className="text-muted-foreground font-semibold">{label}</span>
          </span>
        );
      })}
    </div>
  );
}

export function CheckList({ checks }: { checks: AtsCheck[] }) {
  // Problems first
  const order: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2 };
  const sorted = [...checks].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <ul className="divide-y">
      {sorted.map((c) => {
        const { Icon, cls, label } = STATUS_ICON[c.status];
        return (
          <li key={c.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <Icon className={cn("size-4.5 shrink-0 mt-0.5", cls)} aria-label={label} />
            <div className="min-w-0">
              <p className="text-sm font-bold">{c.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ── Bullet audit ────────────────────────────────────────────────────────────

const RATING_STYLE: Record<BulletRating, string> = {
  strong: "bg-brand/15 text-brand-strong dark:text-brand",
  ok: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  weak: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't copy. Select the text instead.");
        }
      }}
      className="shrink-0 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="Copy rewrite"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function BulletAudit({ items }: { items: BulletAuditItem[] }) {
  const [filter, setFilter] = useState<BulletRating | "all">("all");
  const counts = {
    all: items.length,
    weak: items.filter((i) => i.rating === "weak").length,
    ok: items.filter((i) => i.rating === "ok").length,
    strong: items.filter((i) => i.rating === "strong").length,
  };
  const visible = filter === "all" ? items : items.filter((i) => i.rating === filter);
  const FILTERS: { id: BulletRating | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "weak", label: "Weak" },
    { id: "ok", label: "Could be stronger" },
    { id: "strong", label: "Strong" },
  ];

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No bullets to audit.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filter bullets">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-bold transition-colors",
              filter === f.id ? "bg-brand text-brand-foreground border-brand" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label} <span className="tabular-nums opacity-70">{counts[f.id]}</span>
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {visible.map((b, i) => (
          <li key={`${b.text}-${i}`} className="rounded-2xl border p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider", RATING_STYLE[b.rating])}>
                {b.rating === "ok" ? "Could be stronger" : b.rating}
              </span>
              {b.context && <span className="text-[11px] text-muted-foreground truncate">{b.context}</span>}
            </div>
            <p className={cn("text-sm", b.rewrite && "text-muted-foreground")}>{b.text}</p>
            {b.issues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {b.issues.map((issue) => (
                  <span key={issue} className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {issue}
                  </span>
                ))}
              </div>
            )}
            {b.rewrite && (
              <div className="rounded-xl border-l-4 border-brand bg-brand/5 px-3 py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-strong dark:text-brand">Suggested</p>
                  <p className="text-sm font-medium mt-0.5">{b.rewrite}</p>
                </div>
                <CopyButton text={b.rewrite} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {items.some((b) => /\[[^\]]+\]/.test(b.rewrite)) && (
        <p className="text-[11px] text-muted-foreground">
          Replace placeholders like <span className="font-mono">[X%]</span> with your real numbers. The AI
          never invents metrics.
        </p>
      )}
    </div>
  );
}

// ── Red flags ───────────────────────────────────────────────────────────────

const FLAG_LABEL: Record<RedFlag["type"], string> = {
  spelling: "Spelling",
  grammar: "Grammar",
  tense: "Tense",
  pronoun: "Pronoun",
  email: "Email",
  formatting: "Formatting",
  other: "Other",
};

export function RedFlags({ flags }: { flags: RedFlag[] }) {
  if (!flags.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-brand-strong dark:text-brand" /> No spelling, grammar or tone
        problems found.
      </p>
    );
  }
  return (
    <ul className="space-y-2.5">
      {flags.map((f, i) => (
        <li key={i} className="rounded-xl border p-3 space-y-1.5">
          <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
            {FLAG_LABEL[f.type]}
          </span>
          <p className="text-sm">
            <span className="line-through decoration-rose-500/60 text-muted-foreground">{f.text}</span>
          </p>
          {f.fix && (
            <p className="text-sm">
              <span className="font-semibold">Fix:</span> {f.fix}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

// ── Chips ───────────────────────────────────────────────────────────────────

export function Chips({ items, dashed, empty }: { items: string[]; dashed?: boolean; empty?: string }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">{empty ?? "None found."}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span
          key={s}
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-medium",
            dashed ? "border border-dashed border-brand/50 text-brand-strong dark:text-brand" : "border bg-muted/40",
          )}
        >
          {s}
        </span>
      ))}
    </div>
  );
}
