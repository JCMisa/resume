import {
  CalendarPlus,
  FileStack,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminOverviewAction, listAdminUsersAction } from "@/lib/actions/admin";
import AdminUsers from "./_components/AdminUsers";
import { AdminAccessRedirect, AdminAccessWatcher } from "./_components/AdminAccess";

export const metadata = { title: "Admin" };

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border bg-card shadow-sm p-4 flex items-start gap-3 min-w-0">
      <div className="size-10 shrink-0 rounded-2xl border bg-muted/40 flex items-center justify-center text-muted-foreground">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </p>
        <p className="text-xl font-black tracking-tight tabular-nums leading-tight mt-0.5">{value}</p>
        <p className="text-[11px] text-muted-foreground truncate">{hint}</p>
      </div>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  // Not (or no longer) an admin: toast and go to the dashboard, refreshing the
  // sidebar so a stale Admin link disappears. No admin data is loaded.
  if (!(await requireAdmin())) return <AdminAccessRedirect />;

  const params = await searchParams;
  const [overview, list] = await Promise.all([
    getAdminOverviewAction(),
    listAdminUsersAction({ query: params.q, role: params.role, page: params.page }),
  ]);

  const o = overview.success ? overview.data : null;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <AdminAccessWatcher />
      <header className="flex items-center gap-3 border-b pb-5">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl border">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage who has admin access and keep an eye on usage.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Kpi icon={Users} label="Users" value={o?.users ?? "—"} hint="All accounts" />
        <Kpi icon={ShieldCheck} label="Admins" value={o?.admins ?? "—"} hint="Pro, no usage caps" />
        <Kpi icon={CalendarPlus} label="New this month" value={o?.newThisMonth ?? "—"} hint="Signed up since the 1st (UTC)" />
        <Kpi icon={FileStack} label="Resumes" value={o?.resumes ?? "—"} hint="Uploaded + built" />
        <Kpi icon={Video} label="Interviews" value={o?.interviews ?? "—"} hint="Excludes failed calls" />
        <Kpi icon={Sparkles} label="Analyses" value={o?.analysesThisMonth ?? "—"} hint="AI analyses this month" />
      </div>

      {list.success ? (
        <AdminUsers {...list.data} />
      ) : (
        <div className="rounded-3xl border bg-card p-10 text-center text-sm text-muted-foreground">
          {list.error} Refresh the page to try again.
        </div>
      )}
    </div>
  );
}
