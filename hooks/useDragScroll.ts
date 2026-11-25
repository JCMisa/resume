"use client";

import { useEffect, useRef, useState } from "react";

type ScrollEdges = { overflow: boolean; atStart: boolean; atEnd: boolean };

/**
 * Makes a horizontal overflow strip draggable with the mouse ("grab" to scroll),
 * lets a vertical mouse wheel scroll it sideways, and reports whether there is
 * hidden content on either side (for edge fades). Touch keeps native swiping.
 * A drag never triggers the click of the item it started on.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState<ScrollEdges>({ overflow: false, atStart: true, atEnd: true });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const next = { overflow: max > 1, atStart: el.scrollLeft <= 1, atEnd: el.scrollLeft >= max - 1 };
      setEdges((p) => (p.overflow === next.overflow && p.atStart === next.atStart && p.atEnd === next.atEnd ? p : next));
    };
    // ResizeObserver also fires once right away, which sets the first state
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    el.addEventListener("scroll", update, { passive: true });

    let pointerId = -1;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    const swallowClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || el.scrollWidth <= el.clientWidth) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      moved = false;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (!moved) {
        if (Math.abs(dx) < 5) return; // small wiggle = still a click
        moved = true;
        el.setPointerCapture(pointerId);
        setDragging(true);
      }
      el.scrollLeft = startLeft - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = -1;
      if (!moved) return;
      setDragging(false);
      // the click that follows a drag must not select a step
      el.addEventListener("click", swallowClick, { capture: true, once: true });
      setTimeout(() => el.removeEventListener("click", swallowClick, { capture: true }), 0);
    };
    const onWheel = (e: WheelEvent) => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1 || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      // at either end, let the page scroll as usual
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return { ref, dragging, ...edges };
}
