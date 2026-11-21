"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Video } from "lucide-react";
import InterviewSetupForm from "./_components/InterviewSetupForm";
import Agent from "./_components/Agent";
import InterviewProTeaser from "./_components/InterviewProTeaser";
import InterviewCapReached from "./_components/InterviewCapReached";
import { getUserBillingStatus } from "@/lib/actions/billing";

export default function InterviewsPage() {
  const { user } = useUser();

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

  if (access === null) {
    return (
      <div className="p-12 h-64 w-full bg-muted rounded-2xl animate-pulse" />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-3 border-b pb-6">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl border">
          <Video className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            AI Voice Interview Simulator
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Validate your target role competencies in an interactive real-time
            oral simulation.
          </p>
        </div>
      </header>

      {/* Interviews are Pro-only: Free users see what they'd get */}
      {!access.allowed ? (
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
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <Agent
            userName={user?.firstName || "Candidate"}
            sessionMeta={sessionMeta}
            onLimitReached={refreshAccess}
          />
        </div>
      )}
    </div>
  );
}
