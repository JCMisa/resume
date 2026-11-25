"use client";

import React from "react";
import { FileText } from "lucide-react";
import { PDFViewer } from "@embedpdf/react-pdf-viewer";
import { useAccent } from "@/components/custom/AccentProvider";
import { ACCENTS } from "@/lib/accents";

interface ResumeFileViewerProps {
  url: string | null;
}

/** Blend two #rrggbb colors; amount = share of `b` (0..1). */
function mixHex(a: string, b: string, amount: number) {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return (
    "#" +
    [0, 1, 2]
      .map((i) =>
        Math.round(ch(a, i) * (1 - amount) + ch(b, i) * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export default function ResumeFileViewer({ url }: ResumeFileViewerProps) {
  // The viewer takes plain hex colors, so derive them from the accent theme
  const accent = useAccent();
  const c = ACCENTS[accent];

  if (!url) {
    return (
      <div className="h-full min-h-[500px] border border-dashed border-muted rounded-3xl flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10 animate-in fade-in duration-300">
        <FileText className="h-10 w-10 mb-3 stroke-[1.25]" />
        <p className="text-sm font-semibold text-foreground">
          No File Binary Found
        </p>
        <p className="text-xs max-w-xs mt-1">
          This resume was added before original files were saved, so only its
          text is available.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] lg:h-[calc(100vh-12rem)] border border-border/60 rounded-3xl overflow-hidden shadow-xl bg-stone-100 dark:bg-stone-900 relative flex flex-col animate-in fade-in duration-500 embedpdf-custom">
      {/*
        Scrollbar overrides — EmbedPDF renders its own scrollable viewport,
        so we target the scrollbar via CSS injected below.
        Light:  thumb = var(--brand) (accent theme), track = #f5f5f4 (surface bg)
        Dark:   thumb = var(--brand) (accent theme), track = #1c1917 (dark surface bg)
      */}
      <style>{`
        /* --- Scrollbar styling for the EmbedPDF viewport --- */
        .embedpdf-custom ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .embedpdf-custom ::-webkit-scrollbar-track {
          background: #f5f5f4;
          border-radius: 999px;
        }
        .embedpdf-custom ::-webkit-scrollbar-thumb {
          background: var(--brand);
          border-radius: 999px;
        }
        .embedpdf-custom ::-webkit-scrollbar-thumb:hover {
          background: var(--brand-hover);
        }
        /* Dark mode overrides via .dark class on a parent */
        .dark .embedpdf-custom ::-webkit-scrollbar-track {
          background: #1c1917;
        }
        .dark .embedpdf-custom ::-webkit-scrollbar-thumb {
          background: var(--brand);
        }
        .dark .embedpdf-custom ::-webkit-scrollbar-thumb:hover {
          background: var(--brand-hover);
        }
        /* Firefox */
        .embedpdf-custom * {
          scrollbar-width: thin;
          scrollbar-color: var(--brand) #f5f5f4;
        }
        .dark .embedpdf-custom * {
          scrollbar-color: var(--brand) #1c1917;
        }
      `}</style>

      <PDFViewer
        key={accent} // the viewer reads its theme once; remount on theme change
        config={{
          src: url,
          theme: {
            preference: "system",

            // ─── Light Mode ───────────────────────────────────────────────
            light: {
              // Accent colors follow the user's theme (lib/accents.ts)
              accent: {
                primary: c.brand,
                primaryHover: c.hover,
                primaryActive: c.strong,
                primaryLight: mixHex(c.brand, "#ffffff", 0.9), // very light tint for selections
                primaryForeground: c.foreground, // readable on the accent color
              },
              background: {
                app: "#f5f5f4", // stone-100 — matches wrapper bg
                surface: "#ffffff", // toolbars / sidebar panels
                surfaceAlt: "#fafaf9", // secondary toolbar row
                elevated: "#ffffff", // dropdowns, popups
                overlay: "rgba(0,0,0,0.3)", // modal backdrop
                input: "#ffffff", // text inputs / checkboxes
              },
              foreground: {
                primary: "#1c1917", // stone-900 — headings / body
                secondary: "#57534e", // stone-600 — labels
                muted: "#a8a29e", // stone-400 — placeholders
                disabled: "#d6d3d1", // stone-300
                onAccent: c.foreground, // readable on the accent color
              },
              interactive: {
                hover: mixHex(c.brand, "#ffffff", 0.94), // subtle hover bg
                active: mixHex(c.brand, "#ffffff", 0.85), // click bg
                selected: mixHex(c.brand, "#ffffff", 0.6), // selected item bg
                focus: c.brand,
              },
              border: {
                default: "#e7e5e4", // stone-200 — --border approximation
                subtle: "#f5f5f4", // stone-100 — very light dividers
                strong: c.brand,
              },
            },

            // ─── Dark Mode ────────────────────────────────────────────────
            dark: {
              // Accent colors follow the user's theme (lib/accents.ts)
              accent: {
                primary: c.brand,
                primaryHover: c.hover,
                primaryActive: c.strong,
                primaryLight: mixHex(c.brand, "#000000", 0.8), // very dark tint
                primaryForeground: c.foreground, // readable on the accent color
              },
              background: {
                app: "#1c1917", // stone-900 — matches dark wrapper
                surface: "#292524", // stone-800 — toolbars / sidebar
                surfaceAlt: "#1c1917", // secondary toolbar row
                elevated: "#3c3734", // stone-700 — dropdowns / popups
                overlay: "rgba(0,0,0,0.5)", // modal backdrop
                input: "#292524", // inputs / checkboxes
              },
              foreground: {
                primary: "#fafaf9", // stone-50 — headings / body
                secondary: "#a8a29e", // stone-400 — labels
                muted: "#57534e", // stone-600 — placeholders
                disabled: "#44403c", // stone-700
                onAccent: c.foreground, // readable on the accent color
              },
              interactive: {
                hover: "#292524", // stone-800 — subtle hover bg
                active: "#3c3734", // stone-700 — click bg
                selected: mixHex(c.brand, "#000000", 0.8), // very dark tint
                focus: c.brand,
              },
              border: {
                default: "rgba(255,255,255,0.1)", // --border dark
                subtle: "rgba(255,255,255,0.06)", // very faint dividers
                strong: c.brand,
              },
            },
          },
          tabBar: "never",
        }}
        className="w-full h-full rounded-3xl overflow-hidden"
      />
    </div>
  );
}
