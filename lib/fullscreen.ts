// Browser Fullscreen API helpers (with the WebKit-prefixed fallbacks Safari on
// iPad/macOS still needs). iPhone Safari has no fullscreen for pages at all:
// fullscreenSupported() is false there and callers fall back to an in-page
// "focus mode" that fills the window.
//
// We always fullscreen the whole document (not one element), so toasts and
// dialogs rendered elsewhere in <body> stay visible.

type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

export function fullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const d = document as WebkitDocument;
  return Boolean(d.fullscreenEnabled || d.webkitFullscreenEnabled);
}

export function isFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const d = document as WebkitDocument;
  return Boolean(d.fullscreenElement || d.webkitFullscreenElement);
}

/**
 * Must run inside a user gesture (click/keypress), or the browser refuses.
 * Resolves false instead of throwing when it's refused or unsupported.
 */
export async function enterFullscreen(): Promise<boolean> {
  if (!fullscreenSupported() || isFullscreen()) return isFullscreen();
  const el = document.documentElement as WebkitElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
    else await el.webkitRequestFullscreen?.();
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen(): Promise<void> {
  if (!isFullscreen()) return;
  const d = document as WebkitDocument;
  try {
    if (d.exitFullscreen) await d.exitFullscreen();
    else await d.webkitExitFullscreen?.();
  } catch {
    // Already exited (e.g. the user pressed Esc at the same moment)
  }
}

/** Subscribe to fullscreen changes (Esc, F11, our buttons). Returns unsubscribe. */
export function onFullscreenChange(handler: () => void): () => void {
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler);
  };
}
