import { describe, expect, it } from "vitest";
import {
  ADMIN_QUERY_MAX,
  containsPattern,
  isRole,
  normalizeRole,
  normalizeUserQuery,
  pageCount,
  parsePage,
  parseRoleFilter,
  roleChangeError,
} from "@/lib/admin";

describe("roleChangeError", () => {
  const base = { actorId: "admin_1", targetId: "user_2", currentRole: "user", nextRole: "admin" };

  it("allows promoting a user and demoting another admin", () => {
    expect(roleChangeError(base)).toBeNull();
    expect(roleChangeError({ ...base, currentRole: "admin", nextRole: "user" })).toBeNull();
  });

  it("treats a null role as user", () => {
    expect(roleChangeError({ ...base, currentRole: null })).toBeNull();
    expect(roleChangeError({ ...base, currentRole: null, nextRole: "user" })).toMatch(/isn't an admin/);
  });

  it("blocks changing your own role (so an admin always remains)", () => {
    expect(
      roleChangeError({ ...base, targetId: "admin_1", currentRole: "admin", nextRole: "user" }),
    ).toMatch(/your own role/);
  });

  it("rejects unknown roles and no-op changes", () => {
    expect(roleChangeError({ ...base, nextRole: "superadmin" })).toBe("Unknown role.");
    expect(roleChangeError({ ...base, nextRole: undefined })).toBe("Unknown role.");
    expect(roleChangeError({ ...base, currentRole: "admin" })).toMatch(/already an admin/);
  });
});

describe("role helpers", () => {
  it("isRole / normalizeRole", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("ADMIN")).toBe(false);
    expect(normalizeRole(null)).toBe("user");
    expect(normalizeRole("admin")).toBe("admin");
  });

  it("parseRoleFilter falls back to all", () => {
    expect(parseRoleFilter("admin")).toBe("admin");
    expect(parseRoleFilter("user")).toBe("user");
    expect(parseRoleFilter("root")).toBe("all");
    expect(parseRoleFilter(["admin"])).toBe("all");
  });
});

describe("paging", () => {
  it("parsePage accepts positive integers only", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });

  it("pageCount is at least 1", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(20)).toBe(1);
    expect(pageCount(21)).toBe(2);
  });
});

describe("search", () => {
  it("normalizes and caps the query", () => {
    expect(normalizeUserQuery("  jane   doe ")).toBe("jane doe");
    expect(normalizeUserQuery(42)).toBe("");
    expect(normalizeUserQuery("x".repeat(500))).toHaveLength(ADMIN_QUERY_MAX);
  });

  it("escapes LIKE wildcards", () => {
    expect(containsPattern("jane")).toBe("%jane%");
    expect(containsPattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
  });
});
