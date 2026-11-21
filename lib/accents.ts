// App accent ("brand") color themes. Single source of truth: the CSS variables
// (--brand, --brand-hover, ...) are generated from this file in app/layout.tsx,
// Tailwind exposes them as bg-brand / text-brand-strong / etc. (app/globals.css),
// and JS-driven visuals (WebGL, canvas, confetti) read the hex values directly.
// Safe to import from client and server.

export type AccentShades = {
  /** Main brand color: buttons, highlights, active states */
  brand: string;
  /** Hover state for brand-colored surfaces */
  hover: string;
  /** Darker shade, readable as text/icons on light backgrounds */
  strong: string;
  /** Text/icon color placed ON a brand-colored background */
  foreground: string;
  /** Lighter glow shade for gradients and shine effects */
  light: string;
};

export const ACCENTS = {
  lime: {
    label: "Lime",
    brand: "#9ae600",
    hover: "#a8f000",
    strong: "#5a8800",
    foreground: "#1e3800",
    light: "#c8f400",
  },
  blue: {
    label: "Ocean",
    brand: "#2563eb",
    hover: "#3b82f6",
    strong: "#1d4ed8",
    foreground: "#ffffff",
    light: "#93c5fd",
  },
  violet: {
    label: "Violet",
    brand: "#7c3aed",
    hover: "#8b5cf6",
    strong: "#6d28d9",
    foreground: "#ffffff",
    light: "#c4b5fd",
  },
  rose: {
    label: "Rose",
    brand: "#e11d48",
    hover: "#f43f5e",
    strong: "#be123c",
    foreground: "#ffffff",
    light: "#fda4af",
  },
  amber: {
    label: "Amber",
    brand: "#f59e0b",
    hover: "#fbbf24",
    strong: "#b45309",
    foreground: "#451a03",
    light: "#fcd34d",
  },
  teal: {
    label: "Teal",
    brand: "#14b8a6",
    hover: "#2dd4bf",
    strong: "#0f766e",
    foreground: "#042f2e",
    light: "#5eead4",
  },
} as const satisfies Record<string, AccentShades & { label: string }>;

export type AccentId = keyof typeof ACCENTS;

export const DEFAULT_ACCENT: AccentId = "lime";
export const ACCENT_IDS = Object.keys(ACCENTS) as AccentId[];
/** localStorage key used by the pre-paint script and the AccentProvider. */
export const ACCENT_STORAGE_KEY = "resume-accent";

export function isAccentId(value: unknown): value is AccentId {
  return typeof value === "string" && value in ACCENTS;
}

/** Color tokens components can pass instead of a hex, e.g. <LightPillar bottomColor="brand" />. */
export type BrandToken = "brand" | "brand-hover" | "brand-strong" | "brand-foreground" | "brand-light";

const TOKEN_TO_SHADE: Record<BrandToken, keyof AccentShades> = {
  brand: "brand",
  "brand-hover": "hover",
  "brand-strong": "strong",
  "brand-foreground": "foreground",
  "brand-light": "light",
};

/** Resolve a brand token (or pass a normal color through) for the given accent. */
export function resolveBrandColor(color: string, accent: AccentId): string {
  const shade = TOKEN_TO_SHADE[color as BrandToken];
  return shade ? ACCENTS[accent][shade] : color;
}

/** CSS that defines the --brand* variables for every accent (default on :root). */
export function accentCss() {
  const vars = (a: AccentShades) =>
    `--brand:${a.brand};--brand-hover:${a.hover};--brand-strong:${a.strong};--brand-foreground:${a.foreground};--brand-light:${a.light};`;
  return [
    `:root{${vars(ACCENTS[DEFAULT_ACCENT])}}`,
    ...ACCENT_IDS.filter((id) => id !== DEFAULT_ACCENT).map(
      (id) => `:root[data-accent="${id}"]{${vars(ACCENTS[id])}}`,
    ),
  ].join("");
}

/** Runs before first paint (inline <head> script) so there's no flash of the default color. */
export function accentBootScript() {
  return `try{var a=localStorage.getItem(${JSON.stringify(ACCENT_STORAGE_KEY)});if(a&&${JSON.stringify(ACCENT_IDS)}.indexOf(a)>-1)document.documentElement.setAttribute("data-accent",a)}catch(e){}`;
}
