"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  ACCENTS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  isAccentId,
  resolveBrandColor,
  type AccentId,
} from "@/lib/accents";

// The active accent lives on <html data-accent="..."> (set before paint by the
// boot script in app/layout.tsx). This store just observes that attribute, so
// every hook user re-renders when it changes. No React context needed.

function readAccent(): AccentId {
  const value = document.documentElement.getAttribute("data-accent");
  return isAccentId(value) ? value : DEFAULT_ACCENT;
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-accent"],
  });
  return () => observer.disconnect();
}

/** Apply an accent locally (DOM + this device's storage). Doesn't persist to the account. */
export function applyAccent(accent: AccentId) {
  if (accent === DEFAULT_ACCENT) {
    document.documentElement.removeAttribute("data-accent");
  } else {
    document.documentElement.setAttribute("data-accent", accent);
  }
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // storage unavailable (private mode etc.): the attribute still applies
  }
}

/** Current accent id. Server render / first hydration pass uses the default. */
export function useAccent(): AccentId {
  return useSyncExternalStore(subscribe, readAccent, () => DEFAULT_ACCENT);
}

/** Hex shades of the current accent, for JS-driven visuals. */
export function useAccentShades() {
  return ACCENTS[useAccent()];
}

/** Resolve a brand token ("brand", "brand-strong", ...) to a hex; other colors pass through. */
export function useResolvedColor(color: string): string {
  return resolveBrandColor(color, useAccent());
}

/** Change the accent here and remember it on the user's account (if signed in). */
export function useSetAccent() {
  return useCallback(async (accent: AccentId) => {
    applyAccent(accent);
    // Lazy import keeps the server action out of pages that never change accents
    const { updateThemeAccentAction } = await import("@/lib/actions/user");
    return updateThemeAccentAction(accent);
  }, []);
}
