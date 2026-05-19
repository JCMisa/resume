"use client";

import React from "react";
import { FileText } from "lucide-react";
import { PDFViewer } from "@embedpdf/react-pdf-viewer";

interface ResumeFileViewerProps {
  url: string | null;
}

export default function ResumeFileViewer({ url }: ResumeFileViewerProps) {
  if (!url) {
    return (
      <div className="h-full min-h-[500px] border border-dashed border-muted rounded-3xl flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10 animate-in fade-in duration-300">
        <FileText className="h-10 w-10 mb-3 stroke-[1.25]" />
        <p className="text-sm font-semibold text-foreground">
          No File Binary Found
        </p>
        <p className="text-xs max-w-xs mt-1">
          This legacy resume was parsed before Cloudinary backup archiving was
          configured.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] lg:h-[calc(100vh-12rem)] border border-border/60 rounded-3xl overflow-hidden shadow-xl bg-stone-100 dark:bg-stone-900 relative flex flex-col animate-in fade-in duration-500 embedpdf-custom">
      {/*
        Scrollbar overrides — EmbedPDF renders its own scrollable viewport,
        so we target the scrollbar via CSS injected below.
        Light:  thumb = #9ae600 (primary), track = #f5f5f4 (surface bg)
        Dark:   thumb = #9ae600 (primary), track = #1c1917 (dark surface bg)
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
          background: #9ae600;
          border-radius: 999px;
        }
        .embedpdf-custom ::-webkit-scrollbar-thumb:hover {
          background: #8bd000;
        }
        /* Dark mode overrides via .dark class on a parent */
        .dark .embedpdf-custom ::-webkit-scrollbar-track {
          background: #1c1917;
        }
        .dark .embedpdf-custom ::-webkit-scrollbar-thumb {
          background: #9ae600;
        }
        .dark .embedpdf-custom ::-webkit-scrollbar-thumb:hover {
          background: #a9eb26;
        }
        /* Firefox */
        .embedpdf-custom * {
          scrollbar-width: thin;
          scrollbar-color: #9ae600 #f5f5f4;
        }
        .dark .embedpdf-custom * {
          scrollbar-color: #9ae600 #1c1917;
        }
      `}</style>

      <PDFViewer
        config={{
          src: url,
          theme: {
            preference: "system",

            // ─── Light Mode ───────────────────────────────────────────────
            light: {
              // oklch(84.265% 0.22557 129.666) → #9ae600
              accent: {
                primary: "#9ae600", // --primary (lime-green)
                primaryHover: "#8bd000", // slightly darker on hover
                primaryActive: "#7cbd00", // pressed state
                primaryLight: "#f4fce3", // very light tint for selections/highlights
                primaryForeground: "#365314", // dark green — readable on lime (#primary-foreground approximated)
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
                onAccent: "#1a2e05", // very dark green on lime buttons
              },
              interactive: {
                hover: "#f0fdf4", // green-50 — subtle hover bg
                active: "#dcfce7", // green-100 — click bg
                selected: "#d9f99d", // lime-200 — selected item bg
                focus: "#9ae600", // focus ring (matches primary)
              },
              border: {
                default: "#e7e5e4", // stone-200 — --border approximation
                subtle: "#f5f5f4", // stone-100 — very light dividers
                strong: "#9ae600", // lime-green — active inputs / emphasis
              },
            },

            // ─── Dark Mode ────────────────────────────────────────────────
            dark: {
              // oklch(0.768 0.233 130.85) → #76c500 (dark mode --primary)
              accent: {
                primary: "#9ae600", // keep brand lime consistent
                primaryHover: "#a9eb26", // lighter on hover in dark
                primaryActive: "#8bd000", // pressed
                primaryLight: "#1a2e05", // very dark tint for selections
                primaryForeground: "#1a2e05", // dark green on lime
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
                onAccent: "#1a2e05", // dark green on lime buttons
              },
              interactive: {
                hover: "#292524", // stone-800 — subtle hover bg
                active: "#3c3734", // stone-700 — click bg
                selected: "#1a2e05", // dark lime tint — selected item
                focus: "#9ae600", // focus ring
              },
              border: {
                default: "rgba(255,255,255,0.1)", // --border dark
                subtle: "rgba(255,255,255,0.06)", // very faint dividers
                strong: "#9ae600", // lime — active inputs / emphasis
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
