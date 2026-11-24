"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowLeft, Expand, Maximize2, Minimize2, Shrink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  enterFullscreen,
  exitFullscreen,
  fullscreenSupported,
  isFullscreen,
  onFullscreenChange,
} from "@/lib/fullscreen";

export type RoomMode = "maximized" | "minimized";

/**
 * The live interview "room". Maximized: fills the whole window over the app
 * (and the screen, when the browser allows fullscreen). Minimized: the same
 * call sits inline on the Interviews page.
 *
 * The call (children) is rendered ONCE into a host <div> that we move between
 * <body> and an inline placeholder. Moving a DOM node doesn't remount React
 * children, so switching modes never drops the live Vapi call.
 */
export default function InterviewRoom({
  role,
  canLeave,
  onLeave,
  children,
}: {
  role: string;
  /** Only before/after a call: leaving mid-call would cut the interview off */
  canLeave: boolean;
  onLeave: () => void;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<RoomMode>("maximized");
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  // Created on the client only (this component renders after a click)
  const [host] = useState<HTMLDivElement | null>(() =>
    typeof document === "undefined" ? null : document.createElement("div"),
  );

  // Put the host where the current mode needs it (before paint: no flash)
  useLayoutEffect(() => {
    if (!host) return;
    const target = mode === "maximized" ? document.body : placeholderRef.current;
    if (target && host.parentElement !== target) target.appendChild(host);
  }, [host, mode]);

  // Remove the host, and leave browser fullscreen, when the room closes
  // (e.g. the call ended and we're going to the results page)
  useEffect(() => {
    return () => {
      host?.remove();
      // Deferred: React's dev-mode double mount runs this cleanup and then
      // re-attaches the host right away; only a real close leaves it detached.
      setTimeout(() => {
        if (!host?.isConnected) void exitFullscreen();
      }, 0);
    };
  }, [host]);

  // Track fullscreen (Esc / F11 / our buttons) and whether it's available
  useEffect(() => {
    const sync = () => setFullscreen(isFullscreen());
    const t = setTimeout(() => {
      setCanFullscreen(fullscreenSupported());
      sync();
    }, 0);
    const off = onFullscreenChange(sync);
    return () => {
      clearTimeout(t);
      off();
    };
  }, []);

  // Keep the page behind the room from scrolling, and focus the room
  useEffect(() => {
    if (mode !== "maximized") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    roomRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mode]);

  function minimize() {
    void exitFullscreen();
    setMode("minimized");
  }

  function maximize() {
    setMode("maximized");
    void enterFullscreen(); // from this click, so the browser allows it
  }

  const toggleFullscreen = () => void (fullscreen ? exitFullscreen() : enterFullscreen());

  const room = (
    <div
      ref={roomRef}
      tabIndex={-1}
      role="region"
      aria-label={`Interview room: ${role}`}
      className={cn(
        "outline-none",
        mode === "maximized"
          ? "fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200"
          : "space-y-3",
      )}
    >
      {mode === "maximized" ? (
        <>
          {/* Call bar */}
          <div className="shrink-0 border-b bg-card/80 backdrop-blur pt-[env(safe-area-inset-top)]">
            <div className="h-14 px-3 sm:px-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Image src="/logo.svg" alt="" width={22} height={22} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-black leading-tight truncate">{role}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                    Mock interview
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {canFullscreen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="rounded-lg gap-1.5"
                    aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
                  >
                    {fullscreen ? <Shrink className="size-4" /> : <Expand className="size-4" />}
                    <span className="hidden sm:inline">{fullscreen ? "Exit full screen" : "Full screen"}</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={minimize}
                  className="rounded-lg gap-1.5"
                  aria-label="Minimize interview room"
                >
                  <Minimize2 className="size-4" />
                  <span className="hidden sm:inline">Minimize</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stage */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="min-h-full flex flex-col items-center justify-center gap-4 px-3 sm:px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="w-full max-w-3xl">{children}</div>
              {canLeave && (
                <Button variant="ghost" size="sm" onClick={onLeave} className="rounded-lg gap-1.5 text-muted-foreground">
                  <ArrowLeft className="size-4" /> Change role or resume
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{role}</p>
              <p className="text-[11px] text-muted-foreground">Interview room minimized</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {canLeave && (
                <Button variant="ghost" size="sm" onClick={onLeave} className="rounded-lg text-muted-foreground">
                  Change
                </Button>
              )}
              <Button size="sm" onClick={maximize} className="rounded-lg gap-1.5 font-bold">
                <Maximize2 className="size-4" /> Maximize
              </Button>
            </div>
          </div>
          {children}
        </>
      )}
    </div>
  );

  return (
    <>
      <div ref={placeholderRef} />
      {host && createPortal(room, host)}
    </>
  );
}
