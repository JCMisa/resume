"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCheck,
  FileSearch,
  Gauge,
  PartyPopper,
  Settings,
  ShieldCheck,
  ShieldOff,
  Target,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import type { NotificationKind } from "@/lib/notifications";
import { usePushDevice } from "@/hooks/usePushDevice";

type Item = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

const POLL_MS = 60_000;
const PROMPT_KEY = "resume:push-prompt-dismissed-at";
const PROMPT_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

const KIND_ICON: Record<NotificationKind, { icon: React.ElementType; tone: string }> = {
  analysis_ready: { icon: FileSearch, tone: "text-brand-strong dark:text-brand" },
  job_match_ready: { icon: Target, tone: "text-brand-strong dark:text-brand" },
  tailor_ready: { icon: WandSparkles, tone: "text-brand-strong dark:text-brand" },
  interview_graded: { icon: Video, tone: "text-brand-strong dark:text-brand" },
  grading_failed: { icon: AlertTriangle, tone: "text-amber-600 dark:text-amber-400" },
  usage_low: { icon: Gauge, tone: "text-amber-600 dark:text-amber-400" },
  usage_reached: { icon: Gauge, tone: "text-rose-600 dark:text-rose-400" },
  admin_granted: { icon: ShieldCheck, tone: "text-brand-strong dark:text-brand" },
  admin_removed: { icon: ShieldOff, tone: "text-muted-foreground" },
  welcome: { icon: PartyPopper, tone: "text-brand-strong dark:text-brand" },
};

function promptSnoozed() {
  try {
    const at = Number(localStorage.getItem(PROMPT_KEY));
    return Number.isFinite(at) && Date.now() - at < PROMPT_SNOOZE_MS;
  } catch {
    return false;
  }
}

/** Soft ask before the browser's one-time permission prompt. */
function PushPrompt() {
  const push = usePushDevice();
  const [snoozed, setSnoozed] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSnoozed(promptSnoozed()), 0);
    return () => clearTimeout(t);
  }, []);

  if (snoozed || push.status !== "off") return null;

  const dismiss = () => {
    try {
      localStorage.setItem(PROMPT_KEY, String(Date.now()));
    } catch {
      // private mode: just hide it for now
    }
    setSnoozed(true);
  };

  return (
    <div className="m-1 mb-2 rounded-xl border bg-brand/5 p-3 space-y-2">
      <div className="flex items-start gap-2.5">
        <BellRing className="size-4 mt-0.5 shrink-0 text-brand-strong dark:text-brand" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">Get alerts on this device?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            We&apos;ll notify you when an analysis or interview grade is ready, even if ResuMe isn&apos;t open.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="size-6 -mt-1 -mr-1 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="rounded-lg font-bold" disabled={push.busy} onClick={() => void push.turnOn()}>
          Turn on
        </Button>
        <Button size="sm" variant="ghost" className="rounded-lg" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [allMuted, setAllMuted] = useState(false);

  const load = useCallback(async () => {
    const res = await getNotificationsAction();
    if (!res.success) return;
    setItems(res.data.items as Item[]);
    setUnread(res.data.unread);
    setAllMuted(res.data.allMuted);
  }, []);

  // Load on mount, when the tab comes back, on a timer, and when a device
  // push arrives (the service worker messages open tabs)
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    const onVisible = () => document.visibilityState === "visible" && void load();
    const timer = setInterval(() => document.visibilityState === "visible" && void load(), POLL_MS);
    const onMessage = (e: MessageEvent) => e.data?.type === "resume:notification" && void load();
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      clearTimeout(t);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [load]);

  async function openItem(item: Item) {
    if (!item.readAt) {
      setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, readAt: new Date() } : i)) ?? prev);
      setUnread((n) => Math.max(0, n - 1));
      void markNotificationReadAction(item.id);
    }
    if (item.href) router.push(item.href);
  }

  async function markAll() {
    setItems((prev) => prev?.map((i) => ({ ...i, readAt: i.readAt ?? new Date() })) ?? prev);
    setUnread(0);
    await markAllNotificationsReadAction();
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) void load();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-brand text-brand-foreground text-[11px] font-black leading-none flex items-center justify-center tabular-nums ring-2 ring-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(380px,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b">
          <p className="text-sm font-black">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void markAll()}
              className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[min(440px,65vh)] overflow-y-auto custom-scrollbar p-1">
          <PushPrompt />

          {items === null ? (
            <div className="space-y-2 p-2" aria-busy="true" aria-label="Loading notifications">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-10 text-center space-y-1.5">
              <Bell className="size-7 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-bold">{allMuted ? "In-app notifications are off" : "You're all caught up"}</p>
              <p className="text-xs text-muted-foreground">
                {allMuted
                  ? "Turn them back on in notification settings."
                  : "Results, plan usage and account updates will show up here."}
              </p>
            </div>
          ) : (
            items.map((item) => {
              const { icon: Icon, tone } = KIND_ICON[item.kind] ?? KIND_ICON.welcome;
              return (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => void openItem(item)}
                  className="items-start gap-3 rounded-lg p-2.5 cursor-pointer whitespace-normal"
                >
                  <div className="size-8 shrink-0 rounded-lg border bg-muted/40 flex items-center justify-center">
                    <Icon className={cn("size-4", tone)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm leading-snug", item.readAt ? "font-medium" : "font-bold")}>
                      {item.title}
                    </p>
                    {item.body && (
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">{item.body}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!item.readAt && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <div className="border-t p-1">
          <DropdownMenuItem asChild className="rounded-lg justify-center text-xs font-bold text-muted-foreground">
            <Link href="/settings?tab=notifications">
              <Settings className="size-3.5" /> Notification settings
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
