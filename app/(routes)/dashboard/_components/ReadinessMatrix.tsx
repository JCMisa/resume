"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";

export default function ReadinessMatrix({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const strokeOffset = circumference * (1 - score / 100);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[360px] relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 size-40 bg-brand/5 rounded-full blur-2xl group-hover:scale-120 transition-transform duration-700" />

      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-brand-strong dark:text-brand bg-brand/8 px-2.5 py-1 rounded-full">
            ResuMe Composite Score
          </span>
          <h3 className="text-lg font-black tracking-tight mt-2">
            Career Readiness
          </h3>
        </div>
        <Trophy className="size-5 text-muted-foreground/60" />
      </div>

      <div className="relative flex items-center justify-center my-2">
        <svg
          width="140"
          height="140"
          viewBox="0 0 120 120"
          className="-rotate-90"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-stone-100 dark:text-stone-800"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            stroke="var(--primary)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: strokeOffset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-black tracking-tighter"
          >
            {score}%
          </motion.span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Match Rating
          </span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border flex items-start gap-2.5">
        <Sparkles className="size-4 text-brand-strong dark:text-brand shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-normal font-medium">
          {score >= 80
            ? "Excellent matching parameters! Your profile layers are optimized to cross top ATS checkpoints easily."
            : score >= 50
              ? "Stable velocity baseline. Run a fresh AI evaluation audit or target voice simulations to increase parameters."
              : "Platform setup pending. Upload a PDF resume document or start a new form workspace to initialize."}
        </p>
      </div>
    </div>
  );
}
