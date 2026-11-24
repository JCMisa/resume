"use client";

import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import InterviewSetupForm from "./_components/InterviewSetupForm";
import Agent, { type StageStatus } from "./_components/Agent";
import InterviewRoom from "./_components/InterviewRoom";
import { enterFullscreen } from "@/lib/fullscreen";
import InterviewProTeaser from "./_components/InterviewProTeaser";
import InterviewCapReached from "./_components/InterviewCapReached";
import PastInterviewsList, {
  useInterviewHistory,
} from "./_components/PastInterviewsList";
import InterviewProgressCard from "./_components/InterviewProgressCard";
import InterviewPrepCard from "./_components/InterviewPrepCard";
import { getUserBillingStatus } from "@/lib/actions/billing";
import {
  PrepCardSkeleton,
  ProgressCardSkeleton,
  SetupFormSkeleton,
} from "./_components/InterviewSkeletons";

export default function InterviewsPage() {
  // Loaded once; shared by the history panel and the progress card
  const history = useInterviewHistory();

  const [sessionMeta, setSessionMeta] = useState<{
    text: string; // extracted text from upload pdf resume
    role: string; // job role typed by user
    desc: string; // optional job desc typed by user
  } | null>(null);
  const [callStatus, setCallStatus] = useState<StageStatus>("idle");

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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px] items-start">
        <div className="min-w-0 space-y-6">
          {access === null ? (
            <SetupFormSkeleton />
          ) : !access.allowed ? (
            // Interviews are Pro-only: Free users see what they'd get
            access.isPro ? (
              <InterviewCapReached />
            ) : (
              <InterviewProTeaser />
            )
          ) : !sessionMeta ? (
            <InterviewSetupForm
              onSetupComplete={(text, role, desc) => {
                // Still inside the Continue click, so the browser allows
                // fullscreen; if it refuses, the room still fills the window
                void enterFullscreen();
                setCallStatus("idle");
                setSessionMeta({ text, role, desc });
              }}
            />
          ) : (
            // Opens maximized (focus mode); can be minimized back to this page
            <InterviewRoom
              role={sessionMeta.role}
              canLeave={callStatus === "idle"}
              onLeave={() => setSessionMeta(null)}
            >
              <Agent
                sessionMeta={sessionMeta}
                onLimitReached={refreshAccess}
                onStatusChange={setCallStatus}
              />
            </InterviewRoom>
          )}

          {/* Score trends under the form */}
          {access === null ? (
            <ProgressCardSkeleton />
          ) : (
            access.allowed && <InterviewProgressCard items={history.items} />
          )}
        </div>

        {/* Right column: prep (mic check) on top, only useful before a call;
            then the history list, which scrolls inside a fixed max height. */}
        <aside className="space-y-6 min-w-0">
          {access === null ? (
            <PrepCardSkeleton />
          ) : (
            access.allowed && !sessionMeta && <InterviewPrepCard />
          )}
          <PastInterviewsList items={history.items} failed={history.failed} />
        </aside>
      </div>
    </div>
  );
}
