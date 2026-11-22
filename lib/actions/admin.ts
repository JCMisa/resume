"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, desc, eq, gte, ilike, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/config/db";
import { interviews, resumes, usageEvents, users } from "@/config/schema";
import { requireAdmin } from "@/lib/admin-guard";
import {
  ADMIN_FORBIDDEN,
  ADMIN_PAGE_SIZE,
  containsPattern,
  normalizeRole,
  normalizeUserQuery,
  pageCount,
  parsePage,
  parseRoleFilter,
  roleChangeError,
  type AdminOverview,
  type AdminUserRow,
  type Role,
} from "@/lib/admin";
import { startOfMonthUTC } from "@/lib/plans";

// Admin-only actions. Server actions are callable straight from the browser,
// so every one re-checks the caller's role in the DB (requireAdmin) first.

const FORBIDDEN = { success: false as const, error: "Forbidden.", code: ADMIN_FORBIDDEN };

/** Cheap re-check used by the open /admin page (on focus and on a timer). */
export async function getAdminAccessAction() {
  try {
    return { success: true as const, data: { isAdmin: (await requireAdmin()) !== null } };
  } catch (error) {
    console.error("Admin Access Check Failure:", error);
    return { success: false as const, error: "Couldn't check admin access." };
  }
}

/**
 * Send a user who isn't (or is no longer) an admin to the dashboard.
 * Revalidating the layout makes the redirect response carry a fresh sidebar,
 * so the Admin link disappears without a full page reload. No data access,
 * so it's safe to call for anyone.
 */
export async function leaveAdminAction() {
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function getAdminOverviewAction() {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return FORBIDDEN;

    const monthStart = startOfMonthUTC();
    const [[u], [r], [i], [a]] = await Promise.all([
      db
        .select({
          total: count(),
          admins: sql<number>`count(*) filter (where ${users.role} = 'admin')`.mapWith(Number),
          newThisMonth: sql<number>`count(*) filter (where ${users.createdAt} >= ${monthStart})`.mapWith(Number),
        })
        .from(users),
      db.select({ total: count() }).from(resumes),
      db.select({ total: count() }).from(interviews).where(ne(interviews.status, "failed")),
      db
        .select({ total: count() })
        .from(usageEvents)
        .where(and(eq(usageEvents.kind, "resume_analysis"), gte(usageEvents.createdAt, monthStart))),
    ]);

    const data: AdminOverview = {
      users: u?.total ?? 0,
      admins: u?.admins ?? 0,
      newThisMonth: u?.newThisMonth ?? 0,
      resumes: r?.total ?? 0,
      interviews: i?.total ?? 0,
      analysesThisMonth: a?.total ?? 0,
    };
    return { success: true as const, data };
  } catch (error) {
    console.error("Admin Overview Failure:", error);
    return { success: false as const, error: "Failed to load the overview." };
  }
}

export async function listAdminUsersAction(input: { query?: unknown; role?: unknown; page?: unknown }) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return FORBIDDEN;

    // Inputs come from the URL: normalize everything
    const query = normalizeUserQuery(input.query);
    const role = parseRoleFilter(input.role);
    const requestedPage = typeof input.page === "number" ? input.page : parsePage(input.page);

    const filters: SQL[] = [];
    if (query) {
      const pattern = containsPattern(query);
      filters.push(or(ilike(users.name, pattern), ilike(users.email, pattern))!);
    }
    if (role === "admin") filters.push(eq(users.role, "admin"));
    if (role === "user") filters.push(or(eq(users.role, "user"), isNull(users.role))!);
    const where = filters.length ? and(...filters) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(users).where(where);
    const pages = pageCount(total);
    const page = Math.min(Math.max(requestedPage, 1), pages);

    const monthStart = startOfMonthUTC().toISOString();
    // Correlated counts. Columns are written table-qualified on purpose: in a
    // single-table select Drizzle drops the table prefix, so ${users.id} would
    // render as a bare "id" and silently match the subquery table's own id.
    const col = (table: string, column: string) => sql`${sql.identifier(table)}.${sql.identifier(column)}`;
    const userId = col("users", "id");
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        imageUrl: users.imageUrl,
        role: users.role,
        createdAt: users.createdAt,
        resumes: sql<number>`(select count(*) from ${resumes} where ${col("resumes", "user_id")} = ${userId})`.mapWith(Number),
        interviews: sql<number>`(select count(*) from ${interviews} where ${col("interviews", "user_id")} = ${userId} and ${col("interviews", "status")} <> 'failed')`.mapWith(Number),
        analysesThisMonth: sql<number>`(select count(*) from ${usageEvents} where ${col("usage_events", "user_id")} = ${userId} and ${col("usage_events", "kind")} = 'resume_analysis' and ${col("usage_events", "created_at")} >= ${monthStart})`.mapWith(Number),
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt), users.id)
      .limit(ADMIN_PAGE_SIZE)
      .offset((page - 1) * ADMIN_PAGE_SIZE);

    const data: AdminUserRow[] = rows.map((row) => ({
      ...row,
      role: normalizeRole(row.role),
      isYou: row.id === adminId,
    }));

    return {
      success: true as const,
      data: { users: data, total, page, pages, query, role },
    };
  } catch (error) {
    console.error("Admin List Users Failure:", error);
    return { success: false as const, error: "Failed to load users." };
  }
}

/**
 * Make someone an admin, or remove their admin role.
 * Admins get Pro features with no usage caps (lib/actions/billing.ts), so this
 * is effectively free unlimited Pro: only for trusted people.
 */
export async function setUserRoleAction(targetId: unknown, nextRole: unknown) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return FORBIDDEN;
    if (typeof targetId !== "string" || !targetId || targetId.length > 64) {
      return { success: false as const, error: "Unknown user." };
    }

    const [target] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, targetId))
      .limit(1);
    if (!target) return { success: false as const, error: "Unknown user." };

    const problem = roleChangeError({
      actorId: adminId,
      targetId,
      currentRole: target.role,
      nextRole,
    });
    if (problem) return { success: false as const, error: problem };
    const role = nextRole as Role;

    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, targetId))
      .returning({ id: users.id, role: users.role });
    if (!updated) return { success: false as const, error: "Unknown user." };

    // Ids only (no emails) in logs
    console.info(`Admin role change: ${adminId} set ${targetId} to ${role}`);
    revalidatePath("/admin");
    return { success: true as const, data: { id: updated.id, role: normalizeRole(updated.role) } };
  } catch (error) {
    console.error("Set User Role Failure:", error);
    return { success: false as const, error: "Failed to update the role." };
  }
}
