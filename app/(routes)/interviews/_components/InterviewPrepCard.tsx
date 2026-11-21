"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Headphones,
  ListChecks,
  Mic,
  MicOff,
  Timer,
  MessageSquareQuote,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIPS = [
  {
    icon: Headphones,
    text: "Find a quiet spot. Headphones stop the interviewer hearing itself.",
  },
  {
    icon: Timer,
    text: "Expect 5 questions in about 5 minutes, asked one at a time.",
  },
  {
    icon: MessageSquareQuote,
    text: "Answer with STAR: Situation, Task, Action, Result. Concrete numbers help.",
  },
  {
    icon: ListChecks,
    text: "Let the interviewer finish before answering, then click End Session after the last question.",
  },
];

const TEST_SECONDS = 15;

type MicState = "idle" | "testing" | "blocked" | "unsupported" | "error";

/** Live microphone level meter, so mic problems surface before a session starts. */
function MicCheck() {
  const [state, setState] = useState<MicState>("idle");
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  function stop() {
    stopRef.current?.();
    stopRef.current = null;
    setLevel(0);
    setState("idle");
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);

      let raf = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const v of samples) {
          const x = (v - 128) / 128;
          sum += x * x;
        }
        const next = Math.min(1, Math.sqrt(sum / samples.length) * 5);
        setLevel(next);
        if (next > 0.12) setHeard(true);
        raf = requestAnimationFrame(tick);
      };
      tick();

      const timeout = window.setTimeout(stop, TEST_SECONDS * 1000);
      stopRef.current = () => {
        window.clearTimeout(timeout);
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
      };
      setHeard(false);
      setState("testing");
    } catch (error) {
      const name = (error as DOMException)?.name;
      setState(
        name === "NotAllowedError" || name === "SecurityError"
          ? "blocked"
          : "error",
      );
    }
  }

  // Release the microphone if the user navigates away mid-test
  useEffect(() => () => stopRef.current?.(), []);

  return (
    <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {state === "blocked" ? (
            <MicOff className="size-4 text-destructive" />
          ) : (
            <Mic className="size-4 text-brand-strong dark:text-brand" />
          )}
          <p className="text-sm font-bold">Microphone check</p>
        </div>
        {state === "testing" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={stop}
            className="rounded-lg gap-1.5"
          >
            <Square className="size-3" /> Stop
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={start}
            className="rounded-lg gap-1.5"
          >
            <Mic className="size-3.5" /> {heard ? "Test again" : "Test mic"}
          </Button>
        )}
      </div>

      {/* Level meter */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-75"
          style={{ width: `${Math.round(level * 100)}%` }}
        />
      </div>

      <p
        className={cn(
          "text-xs",
          state === "blocked" || state === "error"
            ? "text-destructive"
            : "text-muted-foreground",
        )}
      >
        {state === "testing" ? (
          heard ? (
            <span className="inline-flex items-center gap-1 font-semibold text-brand-strong dark:text-brand">
              <CheckCircle2 className="size-3.5" /> We can hear you. You&apos;re
              good to go.
            </span>
          ) : (
            "Say something. The bar should move when you speak."
          )
        ) : state === "blocked" ? (
          "Microphone access is blocked. Allow it in your browser's site settings (the icon left of the address bar), then test again."
        ) : state === "unsupported" ? (
          "This browser can't access a microphone. Try the latest Chrome, Edge, or Safari."
        ) : state === "error" ? (
          "We couldn't open your microphone. Check it's connected and not in use by another app."
        ) : heard ? (
          <span className="inline-flex items-center gap-1 font-semibold text-brand-strong dark:text-brand">
            <CheckCircle2 className="size-3.5" /> Microphone working.
          </span>
        ) : (
          "Make sure your mic works before you start. Nothing is recorded during this test."
        )}
      </p>
    </div>
  );
}

export default function InterviewPrepCard() {
  return (
    <section className="rounded-3xl border bg-card shadow-sm p-5 space-y-4 h-full">
      <header className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15">
          <ListChecks className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-tight">Before you start</h2>
          <p className="text-[11px] text-muted-foreground">
            A minute of prep makes a better session
          </p>
        </div>
      </header>

      <MicCheck />

      <ul className="space-y-2.5">
        {TIPS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-2.5 text-xs text-muted-foreground">
            <Icon className="size-4 shrink-0 text-brand-strong dark:text-brand mt-px" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
