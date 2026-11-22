// Pure rules for the admin page (unit-tested in tests/admin.test.ts).
// Server-side enforcement lives in lib/actions/admin.ts.

export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_FILTERS = ["all", "admin", "user"] as const;
export type RoleFilter = (typeof ROLE_FILTERS)[number];

export const ADMIN_PAGE_SIZE = 20;

/** Error code admin actions return when the caller isn't (or is no longer) an admin. */
export const ADMIN_FORBIDDEN = "ADMIN_FORBIDDEN";
export const ADMIN_QUERY_MAX = 100;

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Null/unknown DB roles are treated as "user" (the column default). */
export function normalizeRole(value: unknown): Role {
  return value === "admin" ? "admin" : "user";
}

export function parseRoleFilter(value: unknown): RoleFilter {
  return typeof value === "string" && (ROLE_FILTERS as readonly string[]).includes(value)
    ? (value as RoleFilter)
    : "all";
}

/** 1-based page number from a search param; anything invalid is page 1. */
export function parsePage(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
}

export function pageCount(total: number, pageSize = ADMIN_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Trimmed, length-capped search text ("" = no search). */
export function normalizeUserQuery(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, ADMIN_QUERY_MAX);
}

/** ILIKE pattern for a "contains" search, with LIKE wildcards escaped. */
export function containsPattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, "\\$&")}%`;
}

/**
 * Why a role change isn't allowed, or null if it is.
 * Admins can't change their own role, which also guarantees there is always
 * at least one admin left (whoever is making the change).
 */
export function roleChangeError(input: {
  actorId: string;
  targetId: string;
  currentRole: unknown;
  nextRole: unknown;
}): string | null {
  if (!isRole(input.nextRole)) return "Unknown role.";
  if (input.actorId === input.targetId) {
    return "You can't change your own role. Ask another admin.";
  }
  if (normalizeRole(input.currentRole) === input.nextRole) {
    return input.nextRole === "admin" ? "This user is already an admin." : "This user isn't an admin.";
  }
  return null;
}

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  role: Role;
  createdAt: Date;
  resumes: number;
  interviews: number;
  analysesThisMonth: number;
  isYou: boolean;
};

export type AdminOverview = {
  users: number;
  admins: number;
  newThisMonth: number;
  resumes: number;
  interviews: number;
  analysesThisMonth: number;
};
