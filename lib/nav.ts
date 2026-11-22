// Pure sidebar active-state rules (unit-tested in tests/nav.test.ts).

export type NavTone = "strong" | "soft" | "idle";

/** The route itself or any page under it (so /resumes/123 keeps "Resumes" active). */
export function inSection(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(url + "/");
}

/**
 * Highlight for a top-level item:
 * - idle:   not in this section
 * - soft:   in this section, and a *visible* child is the exact current page
 *           (the child carries the strong highlight instead)
 * - strong: in this section otherwise (e.g. /resumes/[id], or children hidden
 *           because the group is collapsed or the sidebar is icon-only)
 */
export function parentTone(
  pathname: string,
  item: { url: string; children?: { url: string }[] },
  childrenVisible: boolean,
): NavTone {
  if (!inSection(pathname, item.url)) return "idle";
  const exactChild = item.children?.some((c) => c.url === pathname);
  return exactChild && childrenVisible ? "soft" : "strong";
}

/** Children match exactly, so /resumes never lights up on /resumes/create. */
export function isChildActive(pathname: string, childUrl: string) {
  return pathname === childUrl;
}
