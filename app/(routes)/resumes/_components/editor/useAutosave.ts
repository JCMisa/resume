"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "dirty" | "saving" | "error";

const DEBOUNCE_MS = 1500;
const RETRY_MS = 5000;

/**
 * Autosave for the resume editor: saves `value` ~1.5s after the last change,
 * on demand (Ctrl+S / Save button), retries failures, never runs two saves at
 * once, and warns before leaving with unsaved changes.
 *
 * `save` receives only the top-level keys that changed since the last
 * successful save, and resolves true on success.
 */
export function useAutosave<T extends Record<string, unknown>>(
  value: T,
  save: (changes: Partial<T>) => Promise<boolean>,
) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastSaved = useRef<Record<string, string>>(snapshot(value));
  const latest = useRef(value);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  // Retries/follow-up saves go through a ref (flush schedules itself)
  const flushRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    latest.current = value;
    saveRef.current = save;
  });

  const changedKeys = useCallback(() => {
    const now = snapshot(latest.current);
    return Object.keys(now).filter((k) => now[k] !== lastSaved.current[k]);
  }, []);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current) return; // the running save re-checks when it finishes
    const keys = changedKeys();
    if (!keys.length) {
      setStatus("saved");
      return;
    }
    inFlight.current = true;
    setStatus("saving");
    const sent = snapshot(latest.current);
    const changes = Object.fromEntries(keys.map((k) => [k, latest.current[k]])) as Partial<T>;
    let ok = false;
    try {
      ok = await saveRef.current(changes);
    } catch {
      ok = false;
    }
    inFlight.current = false;
    if (ok) {
      for (const k of keys) lastSaved.current[k] = sent[k];
      setSavedAt(new Date());
      if (changedKeys().length) {
        setStatus("dirty");
        timer.current = setTimeout(() => void flushRef.current(), DEBOUNCE_MS);
      } else {
        setStatus("saved");
      }
    } else {
      setStatus("error");
      timer.current = setTimeout(() => void flushRef.current(), RETRY_MS);
    }
  }, [changedKeys]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  // Debounced save on every change
  useEffect(() => {
    if (!changedKeys().length) return;
    const t = setTimeout(() => {
      if (!inFlight.current) setStatus((s) => (s === "error" ? s : "dirty"));
    }, 0);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value, changedKeys, flush]);

  // Ctrl/⌘+S saves now (instead of the browser's "save page")
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flush]);

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (inFlight.current || changedKeys().length) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [changedKeys]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { status, savedAt, saveNow: flush, hasUnsaved: () => inFlight.current || changedKeys().length > 0 };
}

function snapshot(value: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, JSON.stringify(v)]));
}
