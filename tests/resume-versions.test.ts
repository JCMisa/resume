import { describe, expect, it } from "vitest";
import { groupVersionsByDay, normalizeVersionLabel, versionDay, versionName } from "@/lib/resume-versions";

describe("version names", () => {
  it("label wins; otherwise by kind", () => {
    expect(versionName({ kind: "manual", label: "Sent to Acme" })).toBe("Sent to Acme");
    expect(versionName({ kind: "manual", label: null })).toBe("Saved version");
    expect(versionName({ kind: "restore", label: null })).toBe("Before restoring");
    expect(versionName({ kind: "auto", label: null })).toBe("Autosaved");
  });

  it("labels are one trimmed line, capped, empty -> null", () => {
    expect(normalizeVersionLabel("  Sent\nto   Acme ")).toBe("Sent to Acme");
    expect(normalizeVersionLabel("   ")).toBeNull();
    expect(normalizeVersionLabel(42)).toBeNull();
    expect(normalizeVersionLabel("x".repeat(100))).toHaveLength(60);
  });
});

describe("grouping by day", () => {
  const now = new Date(2026, 10, 24, 15, 0);
  it("today / yesterday / dates", () => {
    expect(versionDay(new Date(2026, 10, 24, 9, 0), now)).toBe("Today");
    expect(versionDay(new Date(2026, 10, 23, 23, 59), now)).toBe("Yesterday");
    expect(versionDay(new Date(2026, 10, 3, 12, 0), now)).toBe("Tue, Nov 3");
    expect(versionDay(new Date(2025, 10, 3, 12, 0), now)).toMatch(/2025/);
  });

  it("keeps newest-first order inside consecutive day groups", () => {
    const list = [
      { id: "a", createdAt: new Date(2026, 10, 24, 14, 0) },
      { id: "b", createdAt: new Date(2026, 10, 24, 10, 0) },
      { id: "c", createdAt: new Date(2026, 10, 22, 10, 0) },
    ];
    const groups = groupVersionsByDay(list, now);
    expect(groups.map((g) => [g.day, g.items.map((i) => i.id)])).toEqual([
      ["Today", ["a", "b"]],
      ["Sun, Nov 22", ["c"]],
    ]);
  });
});
