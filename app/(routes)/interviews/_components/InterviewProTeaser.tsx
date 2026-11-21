import Link from "next/link";
import {
  CheckCircle2,
  Crown,
  Mic,
  MessageSquareText,
  Target,
  ZapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Static, clearly-labelled sample so Free users can see what a report looks like
// before paying. Not real user data.
const SAMPLE_SCORES = [
  { category: "Technical Depth", score: 85 },
  { category: "Communication Flow", score: 78 },
  { category: "Problem Solving", score: 81 },
  { category: "Role Alignment", score: 74 },
];

const PERKS = [
  {
    icon: Mic,
    title: "Live voice interviews",
    text: "A real-time AI interviewer asks 5 questions tailored to your resume and target role.",
  },
  {
    icon: Target,
    title: "Scored feedback report",
    text: "Category scores, strengths, weaknesses, and concrete tips after every session.",
  },
  {
    icon: MessageSquareText,
    title: "Full transcript history",
    text: "Review every answer you gave and track your progress over time.",
  },
];

export default function InterviewProTeaser() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start animate-in fade-in zoom-in-95 duration-300">
      {/* Pitch */}
      <div className="border rounded-3xl bg-card p-8 space-y-6 shadow-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
          <Crown className="size-3" /> Pro feature
        </span>

        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight">
            Practice real interviews with AI
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI mock interviews are available on the Pro plan. Upgrade to rehearse
            out loud, get graded, and walk into your next interview prepared.
          </p>
        </div>

        <ul className="space-y-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <div className="size-9 shrink-0 rounded-xl border bg-muted/30 flex items-center justify-center text-primary">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <Button
          asChild
          className="rounded-xl font-black text-xs py-5 gap-1.5 w-full shadow-lg shadow-primary/20"
        >
          <Link href="/settings?tab=billing">
            <ZapIcon className="size-3.5 fill-current" />
            Upgrade to Pro
          </Link>
        </Button>
      </div>

      {/* Sample report preview */}
      <div className="relative border rounded-3xl bg-card p-8 space-y-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Sample report
          </p>
          <span className="text-[10px] font-mono text-muted-foreground">
            Frontend Engineer
          </span>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-5xl font-black tracking-tight text-primary">
            80
          </span>
          <span className="text-sm text-muted-foreground mb-1.5">
            / 100 overall
          </span>
        </div>

        <div className="space-y-3">
          {SAMPLE_SCORES.map(({ category, score }) => (
            <div key={category} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">{category}</span>
                <span className="font-mono text-muted-foreground">{score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-primary" /> Strength
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Explained trade-offs in your state management choices clearly, with
            a concrete example from your last project.
          </p>
        </div>

        {/* Fade the bottom to signal there's more behind the paywall */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-card to-transparent" />
      </div>
    </div>
  );
}
