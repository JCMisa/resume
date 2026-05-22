/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Loader2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vapi } from "@/lib/vapi.sdk";
import { configureAssistant } from "@/lib/vapi.config";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { compileInterviewEvaluationAction } from "@/lib/actions/interview";

interface AgentProps {
  userName: string;
  sessionMeta: { id: string; text: string; role: string; desc: string };
}

type StageStatus = "idle" | "connecting" | "active" | "processing_results";

export default function Agent({ userName, sessionMeta }: AgentProps) {
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

  // 🚀 STEP 1: PHYSICALLY ALIGNED TO THE TOP BEFORE ANY CALL LOOPS EXECUTE
  async function handleFinalizeTelemetryCompilation() {
    setStatus("processing_results");
    setStatusMessage(
      "AI is reviewing conversational responses and generating feedback reports...",
    );

    try {
      const finalLog =
        transcriptTimelineRef.current.trim() ||
        "[No verbal data logs captured during session]";
      const res = await compileInterviewEvaluationAction(
        sessionMeta.id,
        finalLog, // the final transcript log of the session
      );

      if (res.success) {
        toast.success("Evaluation compiled safely!");
        router.push(`/interviews/results/${sessionMeta.id}`);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process results metrics.");
      setStatus("idle");
    }
  }

  // 🚀 STEP 2: MOUNT LIFECYCLE LISTENERS ARE DECLARED SECURELY AFTERWARD
  useEffect(() => {
    const onCallStart = () => {
      setStatus("active");
      setSecondsActive(0);
      toast.success("Live secure voice line connected!");
    };

    const onCallEnd = () => {
      handleFinalizeTelemetryCompilation();
    };

    const onMessage = (message: any) => {
      if (message.type === "transcript") {
        setTranscript(message.transcript);
        if (message.transcriptType === "final") {
          transcriptTimelineRef.current += `\n[${message.role.toUpperCase()}]: ${message.transcript}`;
        }
      }
    };

    const onVolumeLevel = (volume: number) => setVolumeLevel(volume);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("volume-level", onVolumeLevel);

    return () => {
      vapi.stop();
      vapi.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "active") {
      interval = setInterval(() => setSecondsActive((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startCall = async () => {
    setStatus("connecting");
    try {
      const config = configureAssistant(
        userName,
        sessionMeta.role,
        sessionMeta.desc,
        sessionMeta.text,
      );
      await vapi.start(config);
    } catch (e) {
      console.log("Error on vapi connection: ", e);
      toast.error("Vapi connection failed.");
      setStatus("idle");
    }
  };

  const endCall = () => {
    vapi.stop(); // Triggers the onCallEnd lifecycle hook automatically
  };

  return (
    <div className="border bg-card p-12 text-center space-y-8 rounded-3xl max-w-xl mx-auto shadow-2xl relative overflow-hidden">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              status === "idle" ? "bg-muted" : "bg-emerald-500 animate-pulse",
            )}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {status.replace("_", " ")}
          </span>
        </div>
        <div className="border px-3 py-1 rounded-full text-xs font-mono font-bold bg-muted/30">
          {format(secondsActive * 1000, "mm:ss")}
        </div>
      </div>

      {status === "processing_results" ? (
        <div className="py-12 space-y-4 animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
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
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : (
                <Activity
                  className={cn(
                    "w-10 h-10",
                    status === "active"
                      ? "text-primary"
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
                    vapi.setMuted(isMicOn);
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
