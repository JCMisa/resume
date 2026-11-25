// Pure rules for the header search (unit-tested in tests/search.test.ts).
// Data search runs in lib/actions/search.ts; the palette is
// components/custom/search/AppSearch.tsx.

export const SEARCH_MIN_CHARS = 2;
export const SEARCH_MAX_CHARS = 80;
export const SEARCH_RESULT_LIMIT = 6;

/** Trimmed, single-spaced, length-capped ("" = nothing to search). */
export function normalizeSearchQuery(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, SEARCH_MAX_CHARS);
}

export function isSearchable(query: string) {
  return query.length >= SEARCH_MIN_CHARS;
}

export type PageIconId =
  | "dashboard"
  | "resumes"
  | "create"
  | "analyze"
  | "interviews"
  | "settings"
  | "billing"
  | "notifications"
  | "security"
  | "admin";

export type AppPage = {
  title: string;
  href: string;
  icon: PageIconId;
  keywords: string[];
  adminOnly?: boolean;
};

export const APP_PAGES: AppPage[] = [
  { title: "Dashboard", href: "/dashboard", icon: "dashboard", keywords: ["home", "overview"] },
  { title: "My resumes", href: "/resumes", icon: "resumes", keywords: ["library", "cv", "scores", "ats"] },
  { title: "Create resume", href: "/resumes/create", icon: "create", keywords: ["build", "new", "editor", "cv"] },
  { title: "Tailor resume to a job", href: "/resumes/create?mode=tailor", icon: "create", keywords: ["tailor", "job", "description", "application", "customize", "rewrite", "apply"] },
  { title: "Analyze with AI", href: "/resumes/analyze", icon: "analyze", keywords: ["upload", "ats", "score", "audit", "pdf", "word"] },
  { title: "Mock interviews", href: "/interviews", icon: "interviews", keywords: ["voice", "practice", "interview"] },
  { title: "Settings", href: "/settings", icon: "settings", keywords: ["profile", "account", "theme", "accent", "name", "photo"] },
  { title: "Billing & plan", href: "/settings?tab=billing", icon: "billing", keywords: ["pro", "upgrade", "subscription", "pricing", "usage", "limits"] },
  { title: "Notification settings", href: "/settings?tab=notifications", icon: "notifications", keywords: ["alerts", "push", "device", "bell"] },
  { title: "Security", href: "/settings?tab=security", icon: "security", keywords: ["password", "2fa", "two-step", "devices", "sign out"] },
  { title: "Admin", href: "/admin", icon: "admin", keywords: ["users", "roles", "manage"], adminOnly: true },
];

/** Pages to suggest before the user types anything. */
const QUICK_LINKS = ["/resumes/analyze", "/resumes/create", "/interviews", "/resumes"];

/**
 * Pages matching the query: every word must appear in the title or keywords
 * (prefix match on keywords, so "up" finds "upload"). Title matches rank first.
 * Empty query -> quick links.
 */
export function matchPages(query: string, isAdmin: boolean): AppPage[] {
  const pages = APP_PAGES.filter((p) => isAdmin || !p.adminOnly);
  const q = normalizeSearchQuery(query).toLowerCase();
  if (!q) return QUICK_LINKS.map((href) => pages.find((p) => p.href === href)!).filter(Boolean);

  const words = q.split(" ");
  const scored = pages
    .map((p) => {
      const title = p.title.toLowerCase();
      const hits = words.map((w) =>
        title.includes(w) ? 2 : p.keywords.some((k) => k.startsWith(w) || k.includes(` ${w}`)) ? 1 : 0,
      );
      return { p, ok: hits.every((h) => h > 0), score: hits.reduce<number>((a, b) => a + b, 0) };
    })
    .filter((x) => x.ok);
  return scored.sort((a, b) => b.score - a.score).map((x) => x.p);
}
