"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Bell,
  BellOff,
  BellRing,
  Laptop,
  Loader2,
  Lock,
  Mail,
  Send,
  Share,
  Smartphone,
  SquarePlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  getNotificationSettingsAction,
  removePushSubscriptionAction,
  sendTestPushAction,
  updateNotificationPrefsAction,
} from "@/lib/actions/notifications";
import {
  CATEGORY_INFO,
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  type NotificationPrefs,
} from "@/lib/notifications";
import { usePushDevice, type PushDeviceStatus } from "@/hooks/usePushDevice";

type Device = { id: string; label: string; endpoint: string; createdAt: Date };

function StatusPill({ status }: { status: PushDeviceStatus }) {
  const on = status === "on";
  const text: Record<PushDeviceStatus, string> = {
    loading: "Checking…",
    on: "On",
    off: "Off",
    blocked: "Blocked",
    unsupported: "Not supported",
    "needs-install": "Install first",
    unconfigured: "Unavailable",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
        on
          ? "border-brand/30 bg-brand/10 text-brand-strong dark:text-brand"
          : status === "blocked"
            ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
            : "bg-muted/40 text-muted-foreground",
      )}
    >
      {text[status]}
    </span>
  );
}

function DeviceHelp({ status }: { status: PushDeviceStatus }) {
  if (status === "needs-install") {
    return (
      <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <Share className="size-3.5 shrink-0" /> 1. In Safari, tap <strong>Share</strong>.
        </li>
        <li className="flex items-center gap-1.5">
          <SquarePlus className="size-3.5 shrink-0" /> 2. Choose <strong>Add to Home Screen</strong>.
        </li>
        <li className="flex items-center gap-1.5">
          <BellRing className="size-3.5 shrink-0" /> 3. Open ResuMe from your Home Screen and turn notifications on here.
        </li>
      </ol>
    );
  }
  if (status === "blocked") {
    return (
      <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
        <Lock className="size-3.5 shrink-0 mt-0.5" />
        <span>
          You blocked notifications for ResuMe. Click the icon left of the address bar, set
          <strong> Notifications</strong> to <strong>Allow</strong>, then reload this page.
        </span>
      </p>
    );
  }
  return null;
}

export default function NotificationSettings() {
  const push = usePushDevice();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pushAvailable, setPushAvailable] = useState(true);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await getNotificationSettingsAction();
    if (!res.success) {
      toast.error(res.error);
      setPrefs(DEFAULT_NOTIFICATION_PREFS);
      return;
    }
    setPrefs(res.data.prefs);
    setDevices(res.data.devices);
    setPushAvailable(res.data.pushAvailable);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function toggle(channel: keyof NotificationPrefs, category: NotificationCategory, value: boolean) {
    if (!prefs) return;
    const previous = prefs;
    const next = { ...prefs, [channel]: { ...prefs[channel], [category]: value } };
    setPrefs(next); // optimistic
    const res = await updateNotificationPrefsAction(next);
    if (!res.success) {
      setPrefs(previous);
      toast.error(res.error);
    }
  }

  async function turnOn() {
    if (await push.turnOn()) await load();
  }

  async function turnOff() {
    await push.turnOff();
    await load();
  }

  async function sendTest() {
    setTesting(true);
    const res = await sendTestPushAction();
    setTesting(false);
    if (res.success) {
      toast.success(`Test sent to ${res.data.sent} device${res.data.sent === 1 ? "" : "s"}.`);
    } else {
      toast.error(res.error);
    }
  }

  async function removeDevice(device: Device) {
    setRemoving(device.id);
    const res = await removePushSubscriptionAction({ id: device.id });
    setRemoving(null);
    if (!res.success) return toast.error(res.error);
    toast.success("Device removed. It won't get notifications anymore.");
    if (device.endpoint === push.endpoint) await push.refresh();
    await load();
  }

  const status: PushDeviceStatus = !pushAvailable && push.status !== "loading" ? "unconfigured" : push.status;
  const deviceText: Partial<Record<PushDeviceStatus, string>> = {
    loading: "Checking this browser…",
    on: "This browser shows a notification when your results are ready, even if ResuMe is closed.",
    off: "Get a notification on this laptop or phone when your results are ready.",
    blocked: "Notifications are blocked for ResuMe in this browser.",
    unsupported: "This browser doesn't support notifications. Try Chrome, Edge, Firefox or Safari.",
    "needs-install": "On iPhone and iPad, notifications only work after adding ResuMe to your Home Screen.",
    unconfigured: "Device notifications aren't available yet.",
  };

  return (
    <section className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm p-6 space-y-6">
      <div className="flex items-start gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
        <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-brand-strong dark:text-brand" />
        </div>
        <div>
          <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-0.5 tracking-tight">
            Notifications
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Choose what we tell you about, and where: in the app, or as a notification on your devices.
          </p>
        </div>
      </div>

      {/* This device */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">This device</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border p-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="size-9 shrink-0 rounded-xl border bg-muted/30 flex items-center justify-center">
              {status === "on" ? (
                <BellRing className="size-4 text-brand-strong dark:text-brand" />
              ) : (
                <BellOff className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold">Device notifications</p>
                <StatusPill status={status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{deviceText[status]}</p>
              <DeviceHelp status={status} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {status === "off" && (
              <Button size="sm" className="rounded-lg font-bold gap-1.5" disabled={push.busy} onClick={() => void turnOn()}>
                {push.busy ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />} Turn on
              </Button>
            )}
            {status === "on" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg gap-1.5"
                  disabled={testing}
                  onClick={() => void sendTest()}
                >
                  {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg"
                  disabled={push.busy}
                  onClick={() => void turnOff()}
                >
                  Turn off
                </Button>
              </>
            )}
          </div>
        </div>

        {devices.length > 0 && (
          <ul className="rounded-xl border divide-y">
            {devices.map((d) => {
              const mobile = /iPhone|Android/.test(d.label);
              const current = d.endpoint === push.endpoint;
              return (
                <li key={d.id} className="flex items-center gap-3 p-3">
                  {mobile ? (
                    <Smartphone className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Laptop className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {d.label}
                      {current && (
                        <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-brand-strong dark:text-brand">
                          This device
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Added {format(new Date(d.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                    disabled={removing === d.id}
                    onClick={() => void removeDevice(d)}
                    aria-label={`Remove ${d.label}`}
                  >
                    {removing === d.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* What to notify about */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">What to notify me about</p>
        {!prefs ? (
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
        ) : (
          <div className="rounded-xl border divide-y">
            {/* Column headers (wide screens) */}
            <div className="hidden sm:grid grid-cols-[1fr_repeat(3,84px)] items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <span>Category</span>
              <span className="text-center">In-app</span>
              <span className="text-center">Device</span>
              <span className="text-center">Email</span>
            </div>
            {NOTIFICATION_CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="grid grid-cols-1 sm:grid-cols-[1fr_repeat(3,84px)] sm:items-center gap-3 sm:gap-2 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">{CATEGORY_INFO[cat].label}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_INFO[cat].description}</p>
                </div>
                <div className="grid grid-cols-3 sm:contents gap-2">
                  <label className="flex flex-col sm:items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="sm:hidden font-bold">In-app</span>
                    <Switch
                      checked={prefs.inApp[cat]}
                      onCheckedChange={(v) => void toggle("inApp", cat, v)}
                      aria-label={`${CATEGORY_INFO[cat].label}: in-app`}
                    />
                  </label>
                  <label className="flex flex-col sm:items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="sm:hidden font-bold">Device</span>
                    <Switch
                      checked={prefs.push[cat]}
                      onCheckedChange={(v) => void toggle("push", cat, v)}
                      aria-label={`${CATEGORY_INFO[cat].label}: device notifications`}
                    />
                  </label>
                  <label className="flex flex-col sm:items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="sm:hidden font-bold">Email</span>
                    <Switch checked={false} disabled aria-label={`${CATEGORY_INFO[cat].label}: email (coming soon)`} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
          <Mail className="size-3.5 shrink-0 mt-px" />
          Email notifications are coming soon. Sign-in codes, password resets and receipts are always emailed by
          our sign-in provider.
        </p>
      </div>
    </section>
  );
}
