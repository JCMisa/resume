"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getAdminAccessAction, leaveAdminAction } from "@/lib/actions/admin";
import AdminLoading from "../loading";

const CHECK_EVERY_MS = 30_000;

/**
 * Toast, then go to the dashboard. leaveAdminAction revalidates the layout,
 * so the sidebar comes back without the Admin link (no full reload).
 */
export function useLeaveAdmin() {
  const leaving = useRef(false);
  return useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    // Fixed id: never shown twice (StrictMode, focus + timer at once)
    toast.info("You don't have admin access anymore. Taking you to your dashboard.", {
      id: "admin-access",
    });
    await leaveAdminAction();
  }, []);
}

/** Rendered by /admin for non-admins instead of a 404. */
export function AdminAccessRedirect() {
  const leave = useLeaveAdmin();
  useEffect(() => {
    void leave();
  }, [leave]);
  return <AdminLoading />;
}

/**
 * While /admin is open, re-check access when the tab regains focus and every
 * 30s, so someone demoted by another admin is moved out promptly.
 */
export function AdminAccessWatcher() {
  const leave = useLeaveAdmin();
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await getAdminAccessAction();
      if (!cancelled && res.success && !res.data.isAdmin) void leave();
    };
    const onVisible = () => void check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [leave]);
  return null;
}
