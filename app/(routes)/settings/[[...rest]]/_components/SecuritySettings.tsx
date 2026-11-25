"use client";

import { useCallback, useEffect, useState } from "react";
import { useClerk, useSession, useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Laptop,
  Link2,
  Loader2,
  LogOut,
  Shield,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Real security status from Clerk. Any change (password, 2FA, connected
// accounts) happens in Clerk's own Security page, which handles verification.

// Derived from the SDK so we don't import types from Clerk's internal packages
type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;
type SessionWithActivitiesResource = Awaited<
  ReturnType<ClerkUser["getSessions"]>
>[number];

function StatusPill({ ok, okText, offText }: { ok: boolean; okText: string; offText: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        ok
          ? "bg-brand/15 text-brand-strong dark:text-brand"
          : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      )}
    >
      {ok ? <CheckCircle2 className="size-3" /> : <CircleAlert className="size-3" />}
      {ok ? okText : offText}
    </span>
  );
}

function Row({
  icon: Icon,
  title,
  description,
  status,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: React.ReactNode;
  status?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="size-9 shrink-0 rounded-xl border bg-muted/30 flex items-center justify-center">
          <Icon className="size-4 text-brand-strong dark:text-brand" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{title}</p>
            {status}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
        </div>
      </div>
      {action && <div className="shrink-0 sm:pl-3">{action}</div>}
    </div>
  );
}

function describeSession(s: SessionWithActivitiesResource) {
  const a = s.latestActivity;
  const device = [a?.browserName, a?.deviceType].filter(Boolean).join(" on ") || "Unknown device";
  const place = [a?.city, a?.country].filter(Boolean).join(", ");
  return { device, place, mobile: Boolean(a?.isMobile) };
}

export default function SecuritySettings() {
  const { user, isLoaded } = useUser();
  const { session: currentSession } = useSession();
  const { openUserProfile } = useClerk();

  const [sessions, setSessions] = useState<SessionWithActivitiesResource[] | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = useCallback(
    () => (user ? user.getSessions() : Promise.resolve([])),
    [user],
  );

  useEffect(() => {
    let cancelled = false;
    loadSessions()
      .then((list) => !cancelled && setSessions(list))
      .catch(() => !cancelled && setSessions([]));
    return () => {
      cancelled = true;
    };
  }, [loadSessions]);

  // Clerk's Security page (password, 2FA, connected accounts, sessions)
  const openSecurity = () =>
    openUserProfile({ __experimental_startPath: "/security" });

  async function revokeSession(s: SessionWithActivitiesResource) {
    setRevoking(s.id);
    try {
      await s.revoke();
      setSessions(await loadSessions());
      toast.success("Signed out of that device.");
    } catch {
      toast.error("Couldn't sign out of that device. Try again from Manage security.");
    } finally {
      setRevoking(null);
    }
  }

  const otherSessions = (sessions ?? []).filter(
    (s) => s.id !== currentSession?.id && s.status === "active",
  );

  async function revokeAllOthers() {
    setRevoking("all");
    try {
      await Promise.all(otherSessions.map((s) => s.revoke()));
      setSessions(await loadSessions());
      toast.success("Signed out of all other devices.");
    } catch {
      toast.error("Couldn't sign out of every device. Try again from Manage security.");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-brand-strong dark:text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-0.5 tracking-tight">
              Security
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Your sign-in methods and the devices signed in to your account.
            </p>
          </div>
        </div>
        <Button onClick={openSecurity} className="rounded-lg font-bold gap-1.5 shrink-0">
          <ShieldCheck className="size-4" /> Manage security
        </Button>
      </div>

      {!isLoaded || !user ? (
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      ) : (
        <>
          {/* Sign-in methods */}
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            <Row
              icon={KeyRound}
              title="Password"
              status={
                <StatusPill ok={user.passwordEnabled} okText="Set" offText="Not set" />
              }
              description={
                user.passwordEnabled
                  ? "You can sign in with your email and password."
                  : "You sign in with a connected account. Add a password as a backup way in."
              }
              action={
                <Button size="sm" variant="outline" className="rounded-lg" onClick={openSecurity}>
                  {user.passwordEnabled ? "Change" : "Set password"}
                </Button>
              }
            />
            <Row
              icon={ShieldCheck}
              title="Two-step verification"
              status={
                <StatusPill ok={user.twoFactorEnabled} okText="On" offText="Off" />
              }
              description={
                user.twoFactorEnabled
                  ? [
                      user.totpEnabled && "Authenticator app",
                      user.backupCodeEnabled && "backup codes",
                    ]
                      .filter(Boolean)
                      .join(" + ") || "Enabled"
                  : "Add a second step at sign-in so a leaked password isn't enough."
              }
              action={
                <Button size="sm" variant="outline" className="rounded-lg" onClick={openSecurity}>
                  {user.twoFactorEnabled ? "Manage" : "Turn on"}
                </Button>
              }
            />
            <Row
              icon={Link2}
              title="Connected accounts"
              description={
                user.externalAccounts.length === 0
                  ? "No social accounts connected."
                  : user.externalAccounts
                      .map((a) => `${a.providerTitle()} (${a.emailAddress || a.username || "connected"})`)
                      .join(" · ")
              }
              action={
                <Button size="sm" variant="outline" className="rounded-lg" onClick={openSecurity}>
                  Manage
                </Button>
              }
            />
          </div>

          {/* Signed-in devices */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Signed-in devices
              </p>
              {otherSessions.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={revoking !== null}
                  onClick={revokeAllOthers}
                  className="rounded-lg gap-1.5 text-muted-foreground"
                >
                  {revoking === "all" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <LogOut className="size-3.5" />
                  )}
                  Sign out all other devices
                </Button>
              )}
            </div>

            {sessions === null ? (
              <div className="h-20 rounded-xl bg-muted animate-pulse" />
            ) : sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Couldn&apos;t load your devices. Use Manage security to review them.
              </p>
            ) : (
              <ul className="space-y-2">
                {sessions
                  .filter((s) => s.status === "active")
                  .map((s) => {
                    const { device, place, mobile } = describeSession(s);
                    const current = s.id === currentSession?.id;
                    const DeviceIcon = mobile ? Smartphone : Laptop;
                    return (
                      <li
                        key={s.id}
                        className="flex items-center gap-3 rounded-xl border px-4 py-3"
                      >
                        <DeviceIcon className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {device}
                            {current && (
                              <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-brand-strong dark:text-brand">
                                This device
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {[place, `active ${formatDistanceToNow(new Date(s.lastActiveAt), { addSuffix: true })}`]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        {!current && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={revoking !== null}
                            onClick={() => revokeSession(s)}
                            className="rounded-lg gap-1.5"
                          >
                            {revoking === s.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <LogOut className="size-3.5" />
                            )}
                            Sign out
                          </Button>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
