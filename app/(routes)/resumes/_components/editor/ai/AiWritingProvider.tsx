"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import UpgradeModal from "@/components/custom/UpgradeModal";
import { aiWriteAction } from "@/lib/actions/ai-writing";
import { aiWriteBlocker, type AiWriteResult, type AiWriteTask } from "@/lib/ai-writing";
import { FREE_LIMITS, isLimitReached } from "@/lib/plans";
import type { ResumeContent } from "@/lib/resume-sanitize";

// Shared state for AI writing in the editor: which resume, the current
// content (sent with each request so unsaved edits are used), the monthly
// allowance, and the upgrade modal.

export type AiAllowance = { isPro: boolean; remaining: number | null };

type Ctx = {
  isPro: boolean;
  remaining: number | null;
  limit: number;
  /** The task running now (one at a time), as a key from taskKey() */
  busy: string | null;
  run: <K extends AiWriteResult["kind"]>(task: AiWriteTask & { kind: K }) => Promise<Extract<AiWriteResult, { kind: K }> | null>;
  resumeId: string;
  content: () => ResumeContent;
  openUpgrade: (title: string, description: string) => void;
};

const AiCtx = createContext<Ctx | null>(null);

export const taskKey = (t: AiWriteTask) => (t.kind === "bullets" ? `bullets:${t.section}:${t.index}` : t.kind);

export function useAiWriting() {
  const ctx = useContext(AiCtx);
  if (!ctx) throw new Error("useAiWriting must be used inside AiWritingProvider");
  return ctx;
}

export default function AiWritingProvider({
  resumeId,
  content,
  allowance,
  children,
}: {
  resumeId: string;
  content: ResumeContent;
  allowance: AiAllowance;
  children: React.ReactNode;
}) {
  const [remaining, setRemaining] = useState(allowance.remaining);
  const [busy, setBusy] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState<{ title: string; description: string } | null>(null);
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const openUpgrade = useCallback((title: string, description: string) => setUpgrade({ title, description }), []);

  const run = useCallback(
    async (task: AiWriteTask) => {
      const current = contentRef.current;
      const blocker = aiWriteBlocker(current, task);
      if (blocker) {
        toast.info(blocker);
        return null;
      }
      if (remaining === 0) {
        setUpgrade({
          title: "You've used this month's AI writing",
          description: `Free includes ${FREE_LIMITS.ai_write} AI writing actions a month. Upgrade to Pro for unlimited AI writing and Tailor to a job.`,
        });
        return null;
      }
      setBusy(taskKey(task));
      try {
        const res = await aiWriteAction(resumeId, task, current);
        if (!res.success) {
          if (isLimitReached(res)) {
            setRemaining(0);
            setUpgrade({ title: "You've used this month's AI writing", description: res.error });
          } else toast.error(res.error);
          return null;
        }
        setRemaining(res.data.remaining);
        return res.data.result;
      } catch {
        toast.error("Couldn't reach the AI. Check your connection and try again.");
        return null;
      } finally {
        setBusy(null);
      }
    },
    [remaining, resumeId],
  ) as Ctx["run"];

  const value = useMemo<Ctx>(
    () => ({
      isPro: allowance.isPro,
      remaining,
      limit: FREE_LIMITS.ai_write,
      busy,
      run,
      resumeId,
      content: () => contentRef.current,
      openUpgrade,
    }),
    [allowance.isPro, remaining, busy, run, resumeId, openUpgrade],
  );

  return (
    <AiCtx.Provider value={value}>
      {children}
      <UpgradeModal
        isOpen={!!upgrade}
        onClose={() => setUpgrade(null)}
        title={upgrade?.title ?? ""}
        description={upgrade?.description ?? ""}
      />
    </AiCtx.Provider>
  );
}
