"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { setUserRoleAction } from "@/lib/actions/admin";
import { useLeaveAdmin } from "./AdminAccess";
import {
  ADMIN_FORBIDDEN,
  ADMIN_PAGE_SIZE,
  ADMIN_QUERY_MAX,
  type AdminUserRow,
  type Role,
  type RoleFilter,
} from "@/lib/admin";

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admins" },
  { value: "user", label: "Users" },
];

function initials(name: string | null, email: string) {
  const src = (name || email).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function Avatar({ user }: { user: AdminUserRow }) {
  // next/image only allows Clerk avatars (next.config.ts)
  if (user.imageUrl?.startsWith("https://img.clerk.com/")) {
    return (
      <Image
        src={user.imageUrl}
        alt=""
        width={40}
        height={40}
        className="size-10 rounded-full border object-cover shrink-0"
      />
    );
  }
  return (
    <div className="size-10 rounded-full border bg-muted flex items-center justify-center text-xs font-black text-muted-foreground shrink-0">
      {initials(user.name, user.email)}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return role === "admin" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider">
      <ShieldCheck className="size-3" /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border bg-muted/40 text-muted-foreground px-2 py-0.5 text-[11px] font-black uppercase tracking-wider">
      User
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function AdminUsers({
  users,
  total,
  page,
  pages,
  query,
  role,
}: {
  users: AdminUserRow[];
  total: number;
  page: number;
  pages: number;
  query: string;
  role: RoleFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, startNavigation] = useTransition();
  const [search, setSearch] = useState(query);
  const [confirming, setConfirming] = useState<{
    user: AdminUserRow;
    next: Role;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const leaveAdmin = useLeaveAdmin();

  // Keep the box in sync when the URL changes (back/forward)
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setSearch(query);
  }

  function navigate(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    startNavigation(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  // Debounced search; a new search always starts on page 1
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === query) return;
    const t = setTimeout(
      () => navigate({ q: trimmed || null, page: null }),
      350,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, query]);

  async function confirmChange() {
    if (!confirming) return;
    setSaving(true);
    const { user, next } = confirming;
    const res = await setUserRoleAction(user.id, next);
    setSaving(false);
    if (!res.success) {
      if ("code" in res && res.code === ADMIN_FORBIDDEN) {
        // Our own admin role was removed meanwhile
        setConfirming(null);
        void leaveAdmin();
        return;
      }
      toast.error(res.error);
      return;
    }
    toast.success(
      next === "admin"
        ? `${user.name || user.email} is now an admin.`
        : `${user.name || user.email} is no longer an admin.`,
    );
    setConfirming(null);
    startNavigation(() => router.refresh());
  }

  const from = total === 0 ? 0 : (page - 1) * ADMIN_PAGE_SIZE + 1;
  const to = (page - 1) * ADMIN_PAGE_SIZE + users.length;

  return (
    <section className="rounded-3xl border bg-card shadow-sm p-4 sm:p-5 space-y-4 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black tracking-tight">Users</h2>
          <span className="text-xs font-bold text-muted-foreground tabular-nums">
            {total}
          </span>
          {navigating && (
            <Loader2
              className="size-4 animate-spin text-muted-foreground"
              aria-label="Loading"
            />
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="size-4 absolute left-3 top-[35%] -translate-y-[35%] text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={ADMIN_QUERY_MAX}
              placeholder="Search name or email"
              aria-label="Search users by name or email"
              className="pl-9 pr-9 rounded-xl"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 size-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div
            role="radiogroup"
            aria-label="Filter by role"
            className="flex rounded-xl border p-1 bg-muted/30 shrink-0"
          >
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={role === f.value}
                onClick={() =>
                  navigate({
                    role: f.value === "all" ? null : f.value,
                    page: null,
                  })
                }
                className={cn(
                  "flex-1 sm:flex-none px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                  role === f.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-2">
          <Users className="size-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-bold">No users found</p>
          <p className="text-xs text-muted-foreground">
            {query || role !== "all"
              ? "Try a different search or filter."
              : "Nobody has signed up yet."}
          </p>
        </div>
      ) : (
        <ul
          className={cn(
            "divide-y rounded-2xl border transition-opacity",
            navigating && "opacity-60",
          )}
        >
          {users.map((user) => (
            <li
              key={user.id}
              className="p-3 sm:p-4 grid gap-3 grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar user={user} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">
                      {user.name || "Unnamed user"}
                    </p>
                    <RoleBadge role={user.role} />
                    {user.isYou && (
                      <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 md:gap-5 md:w-[340px]">
                <Stat label="Resumes" value={user.resumes} />
                <Stat label="Interviews" value={user.interviews} />
                <Stat label="Analyses" value={user.analysesThisMonth} />
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    Joined
                  </p>
                  <p className="text-sm font-bold whitespace-nowrap">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="md:w-40 md:flex md:justify-end">
                {user.isYou ? (
                  <p className="text-[11px] text-muted-foreground md:text-right">
                    Another admin must change your role.
                  </p>
                ) : user.role === "admin" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg font-bold gap-1.5 w-full md:w-auto"
                    onClick={() => setConfirming({ user, next: "user" })}
                  >
                    <ShieldOff className="size-4" /> Remove admin
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="rounded-lg font-bold gap-1.5 w-full md:w-auto"
                    onClick={() => setConfirming({ user, next: "admin" })}
                  >
                    <ShieldCheck className="size-4" /> Make admin
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="tabular-nums">
            {from}–{to} of {total}
          </p>
          {pages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page <= 1 || navigating}
                onClick={() =>
                  navigate({ page: page - 1 > 1 ? String(page - 1) : null })
                }
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="font-bold tabular-nums">
                {page} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page >= pages || navigating}
                onClick={() => navigate({ page: String(page + 1) })}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(o) => !o && !saving && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming?.next === "admin"
                ? "Make this user an admin?"
                : "Remove admin access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.next === "admin" ? (
                <>
                  <strong>
                    {confirming.user.name || confirming.user.email}
                  </strong>{" "}
                  will be able to open this page and change anyone&apos;s role,
                  and gets every Pro feature with no usage caps (free of
                  charge). Only do this for people you trust.
                </>
              ) : (
                <>
                  <strong>
                    {confirming?.user.name || confirming?.user.email}
                  </strong>{" "}
                  loses access to this page right away and goes back to their
                  normal plan (Free, or Pro if they subscribe).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // keep open until the change finishes
                confirmChange();
              }}
              disabled={saving}
              variant={confirming?.next === "user" ? "destructive" : "default"}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {confirming?.next === "admin" ? "Make admin" : "Remove admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
