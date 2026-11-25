/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Loader2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  cancelInterviewSessionAction,
  compileInterviewEvaluationAction,
  createInterviewSessionAction,
} from "@/lib/actions/interview";
import { isLimitReached } from "@/lib/plans";
import { GRADING_FAILED, hasCandidateAnswers } from "@/lib/interview";

interface AgentProps {
  sessionMeta: { text: string; role: string; desc: string };
  /** Called when the server rejects a new session because of a plan limit. */
  onLimitReached?: () => void;
  /** Lets the interview room know whether a call is running. */
  onStatusChange?: (status: StageStatus) => void;
}

export type StageStatus = "idle" | "connecting" | "active" | "processing_results";

export default function Agent({
  sessionMeta,
  onLimitReached,
  onStatusChange,
}: AgentProps) {
  const router = useRouter();
  const [status, setStatus] = useState<StageStatus>("idle");
  const [isMicOn, setIsMicOn] = useState(true);
  const [transcript, setTranscript] = useState(
    "Ready to establish communication...",
  );
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [secondsActive, setSecondsActive] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  // Accumulate raw script changes securely across state scopes
  const transcriptTimelineRef = useRef<string>("");

  // The live DB session id. Created when the call starts; handlers "claim" it by
  // nulling it out, so call-end / call-start-failed / unmount can't double-handle.
  const sessionIdRef = useRef<string | null>(null);

  function claimSession() {
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    return id;
  }

  function resetCallUi() {
    setStatus("idle");
    setSecondsActive(0);
    setVolumeLevel(0);
    transcriptTimelineRef.current = "";
    setTranscript("Ready to establish communication...");
  }

  // Close a session that never really happened. Within the server's refund window
  // it's marked "failed" and doesn't count toward the user's plan limits.
  async function cancelSession(reason: "connection" | "no_answers") {
    const id = claimSession();
    resetCallUi();
    if (!id) return;

    const res = await cancelInterviewSessionAction(id);
    const what =
      reason === "connection"
        ? "The voice call couldn't connect."
        : "No answers were recorded.";
    if (res.success && res.refunded) {
      toast.info(`${what} This session wasn't counted, so you can try again.`);
    } else {
      toast.warning(`${what} This session still counts toward your plan.`);
    }
  }

  // 🚀 STEP 1: PHYSICALLY ALIGNED TO THE TOP BEFORE ANY CALL LOOPS EXECUTE
  async function handleFinalizeTelemetryCompilation() {
    const finalLog = transcriptTimelineRef.current.trim();
    if (!hasCandidateAnswers(finalLog)) {
      await cancelSession("no_answers");
      return;
    }

    const sessionId = claimSession();
    if (!sessionId) return; // already handled by another lifecycle event

    setStatus("processing_results");
    setStatusMessage(
      "AI is reviewing conversational responses and generating feedback reports...",
    );

    try {
      const res = await compileInterviewEvaluationAction(sessionId, finalLog);

      if (res.success) {
        toast.success("Evaluation compiled safely!");
        router.push(`/interviews/results/${sessionId}`);
      } else if ("code" in res && res.code === GRADING_FAILED) {
        // Answers are saved; the results page offers "Retry grading"
        toast.error(res.error);
        router.push(`/interviews/results/${sessionId}`);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process results metrics.");
      setStatus("idle");
    }
  }

  // STEP 2: A fresh Vapi client per call, pointed at OUR proxy
  // (/api/vapi/call/web) instead of api.vapi.ai. The "token" is the signed,
  // one-time call ticket from the server; the server builds the assistant and
  // starts the call with the private key, so the browser can't change its limits.
  const vapiRef = useRef<Vapi | null>(null);

  function disposeClient() {
    const client = vapiRef.current;
    vapiRef.current = null;
    if (!client) return;
    // Detach first so stopping doesn't re-trigger our call-end handling
    client.removeAllListeners();
    // Keep a no-op error listener so a late SDK error during teardown can't
    // throw "Unhandled error"
    client.on("error", () => {});
    client.stop();
  }

  function createClient(callTicket: string) {
    disposeClient();
    // The SDK appends "/call/web", so this hits app/api/vapi/call/web/route.ts
    const client = new Vapi(callTicket, `${window.location.origin}/api/vapi`);

    // The SDK reports failures as "error" events; without a listener they
    // surface as "Unhandled error". Log the detail; the start()/call-end
    // handling below takes care of cancelling and refunding the session.
    client.on("error", (err: any) => {
      console.error("Vapi error:", err);
    });

    client.on("call-start", () => {
      setStatus("active");
      setSecondsActive(0);
      toast.success("Live secure voice line connected!");
    });

    client.on("call-end", () => {
      disposeClient();
      handleFinalizeTelemetryCompilation();
    });

    client.on("message", (message: any) => {
      if (message.type === "transcript") {
        setTranscript(message.transcript);
        if (message.transcriptType === "final") {
          transcriptTimelineRef.current += `\n[${message.role.toUpperCase()}]: ${message.transcript}`;
        }
      }
    });

    client.on("volume-level", (volume: number) => setVolumeLevel(volume));

    client.on("call-start-failed", () => {
      disposeClient();
      cancelSession("connection");
    });

    vapiRef.current = client;
    return client;
  }

  // Leaving the page mid-session: hang up and cancel it
  // (only refunded if still within the server's window)
  useEffect(() => {
    return () => {
      disposeClient();
      const id = claimSession();
      if (id) void cancelInterviewSessionAction(id);
    };
  }, []);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "active") {
      interval = setInterval(() => setSecondsActive((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startCall = async () => {
    if (status !== "idle") return;
    setStatus("connecting");

    // Create (and plan-check) the session only now, right before connecting
    const res = await createInterviewSessionAction({
      jobRole: sessionMeta.role,
      jobDescription: sessionMeta.desc,
      resumeText: sessionMeta.text,
    });

    if (!res.success) {
      setStatus("idle");
      if (isLimitReached(res)) onLimitReached?.();
      else toast.error(res.error || "Couldn't start the interview session.");
      return;
    }

    sessionIdRef.current = res.id;
    transcriptTimelineRef.current = "";

    try {
      const client = createClient(res.callTicket);
      // Placeholder: the proxy ignores it and uses the server-built assistant
      const call = await client.start({ name: "ResuMe-Interviewer" });
      if (!call) {
        // start() resolves null on failure
        disposeClient();
        await cancelSession("connection");
      }
    } catch (e) {
      console.error("Error on vapi connection: ", e);
      disposeClient();
      await cancelSession("connection");
    }
  };

  const endCall = () => {
    vapiRef.current?.stop(); // Triggers the call-end handler, which grades or cancels
  };

  return (
    <div className="w-full border bg-card p-5 sm:p-12 text-center space-y-8 rounded-3xl shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              status === "idle" ? "bg-muted" : "bg-emerald-500 animate-pulse",
            )}
          />
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            {status.replace("_", " ")}
          </span>
        </div>
        <div className="border px-3 py-1 rounded-full text-xs font-mono font-bold bg-muted/30">
          {format(secondsActive * 1000, "mm:ss")}
        </div>
      </div>

      {status === "processing_results" ? (
        <div className="py-12 space-y-4 animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 text-brand-strong dark:text-brand animate-spin mx-auto" />
          <p className="text-sm font-bold max-w-xs mx-auto text-muted-foreground leading-relaxed">
            {statusMessage}
          </p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
            <AnimatePresence>
              {status === "active" && (
                <motion.div
                  animate={{
                    opacity: [0.1, 0.25, 0.1],
                    scale: 1 + volumeLevel * 1.8,
                  }}
                  className="absolute inset-0 bg-primary rounded-full blur-2xl pointer-events-none"
                />
              )}
            </AnimatePresence>
            <div className="w-28 h-28 border rounded-full flex items-center justify-center bg-background shadow-md relative z-10">
              {status === "connecting" ? (
                <Loader2 className="w-10 h-10 text-brand-strong dark:text-brand animate-spin" />
              ) : (
                <Activity
                  className={cn(
                    "w-10 h-10",
                    status === "active"
                      ? "text-brand-strong dark:text-brand"
                      : "text-muted-foreground/20",
                  )}
                />
              )}
            </div>
          </div>

          <div className="min-h-[60px] flex items-center justify-center px-4">
            <p
              className={cn(
                "text-base font-medium leading-relaxed",
                status === "idle"
                  ? "text-muted-foreground/50 italic"
                  : "text-foreground",
              )}
            >
              {status === "idle"
                ? "Click Start below to begin your voice session matrix."
                : `"${transcript}"`}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            {status === "idle" ? (
              <button
                onClick={startCall}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl shadow-lg transition-all"
              >
                Start Call
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsMicOn(!isMicOn);
                    vapiRef.current?.setMuted(isMicOn);
                  }}
                  className={cn(
                    "border p-3.5 rounded-xl transition-colors",
                    !isMicOn &&
                      "bg-destructive/10 text-destructive border-destructive/30",
                  )}
                >
                  {isMicOn ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={endCall}
                  className="bg-destructive text-destructive-foreground font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md hover:bg-destructive/90 transition-all"
                >
                  <PhoneOff className="w-4 h-4" /> End Session
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
