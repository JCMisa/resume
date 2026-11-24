"use client";

import { useEffect, useRef, useState } from "react";
import { PAGE } from "@/lib/resume-templates";

const PX_PER_PT = 96 / 72;
const PAGE_W = PAGE.width * PX_PER_PT; // ~794px
const PAGE_H = PAGE.height * PX_PER_PT; // ~1123px

/**
 * Shows a fixed-size A4 page (ResumeDocument) scaled to fit its container's
 * width, with dashed guides where PDF pages will break.
 * - `clip`: only the first page (template thumbnails)
 * - `minScale`: never shrink below this (document mode on phones); the page
 *   scrolls sideways instead, so the text stays big enough to edit
 */
export default function ScaledPage({
  children,
  maxScale = 1,
  minScale = 0,
  clip = false,
  pageBreaks = false,
}: {
  children: React.ReactNode;
  maxScale?: number;
  minScale?: number;
  clip?: boolean;
  pageBreaks?: boolean;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [contentH, setContentH] = useState(PAGE_H);
  const [outerW, setOuterW] = useState(0);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const ro = new ResizeObserver(() => {
      setOuterW(o.clientWidth);
      setScale(Math.max(minScale, Math.min(maxScale, o.clientWidth / PAGE_W)));
      setContentH(Math.max(PAGE_H, i.scrollHeight));
    });
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [maxScale, minScale]);

  const height = (clip ? PAGE_H : contentH) * scale;
  const width = PAGE_W * scale;
  const pages = Math.ceil(contentH / PAGE_H - 0.01);
  const offsetX = Math.max(0, (outerW - width) / 2);

  return (
    <div ref={outer} className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
      <div
        className="relative"
        style={{
          width: scale ? Math.max(width, outerW) : "100%",
          height: height || undefined,
          aspectRatio: scale ? undefined : `${PAGE_W} / ${PAGE_H}`,
          overflow: "hidden",
        }}
      >
        <div
          ref={inner}
          className="absolute top-0 left-0 origin-top-left shadow-sm"
          style={{ width: PAGE_W, transform: `translateX(${offsetX}px) scale(${scale || 0.001})`, visibility: scale ? "visible" : "hidden" }}
        >
          {children}
          {pageBreaks &&
            !clip &&
            Array.from({ length: Math.max(0, pages - 1) }, (_, i) => (
              <div
                key={i}
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-rose-400/70"
                style={{ top: PAGE_H * (i + 1) }}
              >
                <span className="absolute right-2 -top-5 rounded bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                  Page {i + 2}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
