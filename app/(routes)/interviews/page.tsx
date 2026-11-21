"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Video } from "lucide-react";
import InterviewSetupForm from "./_components/InterviewSetupForm";
import Agent from "./_components/Agent";
import InterviewProTeaser from "./_components/InterviewProTeaser";
import InterviewCapReached from "./_components/InterviewCapReached";
import PastInterviewsList, {
  useInterviewHistory,
} from "./_components/PastInterviewsList";
import InterviewProgressCard from "./_components/InterviewProgressCard";
import InterviewPrepCard from "./_components/InterviewPrepCard";
import { getUserBillingStatus } from "@/lib/actions/billing";

export default function InterviewsPage() {
  const { user } = useUser();
  // Loaded once; shared by the history panel and the progress card
  const history = useInterviewHistory();

  const [sessionMeta, setSessionMeta] = useState<{
    text: string; // extracted text from upload pdf resume
    role: string; // job role typed by user
    desc: string; // optional job desc typed by user
  } | null>(null);

  // Interview access: Free users see the Pro teaser; Pro users who used their
  // monthly allowance see when it resets.
  const [access, setAccess] = useState<{
    allowed: boolean;
    isPro: boolean;
  } | null>(null);

  const loadAccess = async () => {
    const billing = await getUserBillingStatus();
    return {
      allowed: Boolean(billing?.allowed?.interview),
      isPro: Boolean(billing?.isPro),
    };
  };
  const refreshAccess = () => {
    loadAccess().then(setAccess);
  };

  useEffect(() => {
    let cancelled = false;
    loadAccess().then((next) => {
      if (!cancelled) setAccess(next);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionMeta]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-3 border-b pb-5">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl border">
          <Video className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            AI Voice Interview Simulator
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Practice out loud with an AI interviewer tailored to your resume and
            target role.
          </p>
        </div>
      </header>

      {/* Main area (setup / live call / upsell) + interview history side panel */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] items-start">
        <div className="min-w-0 space-y-6">
          {access === null ? (
            <div className="h-96 w-full bg-muted rounded-3xl animate-pulse" />
          ) : !access.allowed ? (
            // Interviews are Pro-only: Free users see what they'd get
            access.isPro ? (
              <InterviewCapReached />
            ) : (
              <InterviewProTeaser />
            )
          ) : !sessionMeta ? (
            <InterviewSetupForm
              onSetupComplete={(text, role, desc) =>
                setSessionMeta({ text, role, desc })
              }
            />
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
              <Agent
                userName={user?.firstName || "Candidate"}
                sessionMeta={sessionMeta}
                onLimitReached={refreshAccess}
              />
            </div>
          )}

          {/* Below the main area: progress + prep (mic check). The mic test is
              only useful before a call, so it's hidden during one. */}
          {access?.allowed && (
            <div
              className={`grid gap-6 items-stretch ${sessionMeta ? "" : "lg:grid-cols-2"}`}
            >
              <InterviewProgressCard items={history.items} />
              {!sessionMeta && <InterviewPrepCard />}
            </div>
          )}
        </div>

        {/* On xl the panel is taken out of flow (absolute), so the row height
            comes from the left column only; the panel then grows with its
            content up to that height and scrolls beyond it. */}
        <aside className="relative xl:self-stretch">
          <div className="xl:absolute xl:inset-x-0 xl:top-0 xl:max-h-full flex flex-col">
            <PastInterviewsList items={history.items} failed={history.failed} />
          </div>
        </aside>
      </div>
    </div>
  );
}
