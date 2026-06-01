"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Video } from "lucide-react";
import InterviewSetupForm from "./_components/InterviewSetupForm";
import Agent from "./_components/Agent";
import { getUserBillingStatus } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";
import { LockIcon, ZapIcon } from "lucide-react";
import Link from "next/link";

export default function InterviewsPage() {
  const { user } = useUser();

  const [sessionMeta, setSessionMeta] = useState<{
    id: string; // id of the interview being created
    text: string; // extracted text from upload pdf resume
    role: string; // job role typed by user
    desc: string; // optional job desc typed by user
  } | null>(null);

  // 🚀 Local states managing tier limits
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const billing = await getUserBillingStatus();
      if (!billing || !billing.allowed || !billing.allowed.interview) {
        setHasAccess(false);
        return;
      }
      setHasAccess(billing.allowed.interview);
    };
    checkAccess();
  }, [sessionMeta]);

  if (hasAccess === null) {
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

      {/* 🚀 FIXED: Block form initialization if free allotment limits are hit */}
      {!hasAccess ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-3xl bg-muted/10 space-y-4 max-w-md mx-auto text-center border-dashed mt-8 animate-in fade-in zoom-in-95">
          <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
            <LockIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-black tracking-tight">
            Interview Sessions Exhausted
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Free accounts include up to 2 high-fidelity live audio simulations.
            Upgrade to a premium membership to unlock unlimited real-time
            speaking reviews!
          </p>
          <Button
            asChild
            className="rounded-xl font-black text-xs !py-5 gap-1.5 w-full shadow-lg shadow-primary/20 bg-primary text-primary-foreground"
          >
            <Link href="/settings?tab=billing">
              <ZapIcon className="size-3.5 fill-current" />
              Unlock Unlimited Practice
            </Link>
          </Button>
        </div>
      ) : !sessionMeta ? (
        <InterviewSetupForm
          onSetupComplete={(id, text, role, desc) =>
            setSessionMeta({ id, text, role, desc })
          }
        />
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <Agent
            userName={user?.firstName || "Candidate"}
            sessionMeta={sessionMeta}
          />
        </div>
      )}
    </div>
  );
}
