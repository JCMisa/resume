// Version history rules (pure, unit-tested). Server code: lib/resume-versions-server.ts
// and lib/actions/resume-versions.ts.

export const VERSION_KINDS = ["auto", "manual", "restore"] as const;
export type VersionKind = (typeof VERSION_KINDS)[number];

/** An automatic snapshot is taken at most this often while editing. */
export const AUTO_VERSION_MINUTES = 10;
/** Versions kept per resume; the oldest are deleted beyond this. */
export const MAX_VERSIONS = 50;
export const VERSION_LABEL_MAX = 60;

export type VersionListItem = {
  id: string;
  kind: VersionKind;
  label: string | null;
  title: string;
  createdAt: Date;
};

export const isVersionKind = (v: unknown): v is VersionKind =>
  typeof v === "string" && (VERSION_KINDS as readonly string[]).includes(v);

/** A user's version name: one line, trimmed, capped; empty -> null. */
export function normalizeVersionLabel(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, VERSION_LABEL_MAX);
  return s || null;
}

/** What a version is called in the list. */
export function versionName(v: { kind: string; label: string | null }): string {
  if (v.label) return v.label;
  if (v.kind === "manual") return "Saved version";
  if (v.kind === "restore") return "Before restoring";
  return "Autosaved";
}

/** "Today", "Yesterday", or "Mon, Nov 3" (local time), for grouping the list. */
export function versionDay(date: Date, now = new Date()): string {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(date)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

/** Versions grouped by day, newest first (input is already newest first). */
export function groupVersionsByDay<T extends { createdAt: Date }>(list: T[], now = new Date()) {
  const groups: { day: string; items: T[] }[] = [];
  for (const v of list) {
    const day = versionDay(new Date(v.createdAt), now);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(v);
    else groups.push({ day, items: [v] });
  }
  return groups;
}
