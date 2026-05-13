"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggler } from "./ThemeToggler";

// ─── tiny helpers ────────────────────────────────────────────────────────────

/** A titled group block */
function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <hr className="mb-6 border-border" />
      {children}
    </section>
  );
}

/** A horizontal row of items */
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-4 items-end">{children}</div>;
}

/** Label under an item */
function Cap({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-center text-[10px] text-muted-foreground">
      {children}
    </p>
  );
}

/** Color swatch */
function Swatch({ bg, name }: { bg: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-10 w-20 rounded-md border border-border"
        style={{ background: bg }}
      />
      <span className="text-[10px] text-muted-foreground">{name}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const SamplePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Sticky header with theme toggle ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background px-8 py-4">
        <div>
          <h1 className="text-heading-sm font-bold text-foreground">
            Design System Reference
          </h1>
          <p className="text-body-sm text-muted-foreground">
            globals.css custom classes — usage cheatsheet
          </p>
        </div>
        <ThemeToggler />
      </header>

      <main className="mx-auto max-w-5xl px-8 py-12">
        {/* ══════════════════════════════════════════════════════════════════
            1. COLOR TOKENS
            Usage: className="bg-deep-teal"  /  className="text-midnight-ink"
                   className="border-fresh-teal"
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="1 · Color tokens — className='bg-*' / 'text-*' / 'border-*'">
          <p className="mb-4 text-body-sm text-muted-foreground">
            All colors live in <code className="text-xs">@theme inline</code> so
            Tailwind generates <code className="text-xs">bg-*</code>,{" "}
            <code className="text-xs">text-*</code>, and{" "}
            <code className="text-xs">border-*</code> utilities automatically.
          </p>
          <Row>
            <Swatch bg="#fff5ee" name="canvas-porcelain" />
            <Swatch bg="#ffffff" name="white" />
            <Swatch bg="#0f161e" name="midnight-ink" />
            <Swatch bg="#333942" name="harbor-mist" />
            <Swatch bg="#012620" name="forest-canopy" />
            <Swatch bg="#004038" name="deep-teal" />
            <Swatch bg="#00f5dc" name="fresh-teal" />
            <Swatch bg="#00544c" name="muted-sage" />
            <Swatch bg="#fde8ce" name="soft-peach" />
            <Swatch bg="#ffdcbf" name="muted-mandarin" />
            <Swatch bg="#bee9f4" name="sky-haze" />
            <Swatch bg="#d5ff4d" name="lime-glow" />
            <Swatch bg="#7edcaf" name="spring-bud" />
            <Swatch
              bg="linear-gradient(90deg,#00f5dc,#d5ff4d 48.5%,#b773ff)"
              name="fresh-teal-gradient"
            />
          </Row>

          {/* Code examples */}
          <div className="mt-6 rounded-md bg-muted p-4 text-xs font-mono text-muted-foreground space-y-1">
            <p>{`<div className="bg-deep-teal text-white" />`}</p>
            <p>{`<p className="text-harbor-mist" />`}</p>
            <p>{`<div className="border border-fresh-teal" />`}</p>
            <p>{`<div className="bg-fresh-teal-gradient" />  {/* custom utility */}`}</p>
          </div>
        </Group>

        {/* ══════════════════════════════════════════════════════════════════
            2. TYPOGRAPHY
            Usage: className="text-display" / "text-heading-lg" / "text-heading"
                   "text-heading-sm" / "text-subheading" / "text-body" / "text-body-sm"
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="2 · Typography — className='text-*'">
          <div className="space-y-3">
            <div>
              <p className="text-display">Display 72px</p>
              <code className="text-[10px] text-muted-foreground">
                className=&quot;text-display&quot;
              </code>
            </div>
            <div>
              <p className="text-heading-lg">Heading LG 56px</p>
              <code className="text-[10px] text-muted-foreground">
                className=&quot;text-heading-lg&quot;
              </code>
            </div>
            <div>
              <p className="text-heading">Heading 32px</p>
              <code className="text-[10px] text-muted-foreground">
                className=&quot;text-heading&quot;
              </code>
            </div>
            <div>
              <p className="text-heading-sm">Heading SM 24px</p>
              <code className="text-[10px] text-muted-foreground">
                className=&quot;text-heading-sm&quot;
              </code>
            </div>
            <div>
              <p className="text-subheading">
                Subheading 20px — The quick brown fox
              </p>
              <code className="text-[10px] text-muted-foreground">
                className=&quot;text-subheading&quot;
              </code>
            </div>
            <div>
              <p className="text-body">
                Body 18px — The quick brown fox jumps over the lazy dog.
              </p>
              <code className="text-[10px] text-muted-foreground">
                className=&quot;text-body&quot;
              </code>
            </div>
            <div>
              <p className="text-body-sm">
                Body SM 16px — The quick brown fox jumps over the lazy dog.
              </p>
              <code className="text-[10px] text-muted-foreground">
                className=&quot;text-body-sm&quot;
              </code>
            </div>
          </div>

          {/* Font families */}
          <div className="mt-6 space-y-2 rounded-md border border-border p-4">
            <p
              style={{ fontFamily: "var(--font-sans)" }}
              className="text-body-sm"
            >
              <strong>font-sans</strong> (Open Sans / Proxima Nova) — used for
              everything
            </p>
            <p
              style={{ fontFamily: "var(--font-serif)" }}
              className="text-body-sm"
            >
              <strong>font-serif</strong> (Source Serif 4) — used sparingly for
              accents
            </p>
            <p
              style={{ fontFamily: "var(--font-mono)" }}
              className="text-body-sm"
            >
              <strong>font-mono</strong> (Geist Mono) — code only
            </p>
          </div>
        </Group>

        {/* ══════════════════════════════════════════════════════════════════
            3. CARD VARIANTS
            Usage: className="card-default"
                   className="card-soft-peach"
                   className="card-fresh-teal"
                   className="card-muted-mandarin"
                   className="card-sky-haze"
            Note: these classes set bg + border-radius + padding (32px) all at once.
                  Add your own content inside.
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="3 · Card variants — className='card-*'">
          <p className="mb-4 text-body-sm text-muted-foreground">
            Each class sets <code className="text-xs">background-color</code>,{" "}
            <code className="text-xs">border-radius: 16px</code>, and{" "}
            <code className="text-xs">padding: 32px</code>. Just add content
            inside.
          </p>
          <Row>
            {(
              [
                ["card-default", "card-default"],
                ["card-soft-peach", "card-soft-peach"],
                ["card-fresh-teal", "card-fresh-teal"],
                ["card-muted-mandarin", "card-muted-mandarin"],
                ["card-sky-haze", "card-sky-haze"],
              ] as [string, string][]
            ).map(([cls, label]) => (
              <div key={cls} className="flex flex-col" style={{ width: 160 }}>
                {/* ↓ the actual class in action */}
                <div className={cls}>
                  <p className="text-body-sm font-bold text-midnight-ink">
                    Title
                  </p>
                  <p className="text-body-sm text-harbor-mist mt-1">
                    Body text here.
                  </p>
                </div>
                <Cap>.{label}</Cap>
              </div>
            ))}
          </Row>

          <div className="mt-4 rounded-md bg-muted p-4 text-xs font-mono text-muted-foreground">
            {`<div className="card-soft-peach">`}
            <br />
            {`  <h2 className="text-heading-sm">Title</h2>`}
            <br />
            {`  <p className="text-body-sm text-harbor-mist">Body</p>`}
            <br />
            {`</div>`}
          </div>
        </Group>

        {/* ══════════════════════════════════════════════════════════════════
            4. SECTION BACKGROUNDS
            Usage: className="section-dark"          → Forest Canopy bg + white text
                   className="bg-fresh-teal-gradient" → 3-stop gradient
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="4 · Section backgrounds — className='section-dark' / 'bg-fresh-teal-gradient'">
          <Row>
            <div className="flex flex-col" style={{ width: 200 }}>
              <div className="section-dark flex h-20 items-center justify-center rounded-lg">
                <p className="text-body-sm font-bold">section-dark</p>
              </div>
              <Cap>.section-dark</Cap>
            </div>

            <div className="flex flex-col" style={{ width: 200 }}>
              <div className="bg-fresh-teal-gradient flex h-20 items-center justify-center rounded-lg">
                <p className="text-body-sm font-bold text-midnight-ink">
                  gradient
                </p>
              </div>
              <Cap>.bg-fresh-teal-gradient</Cap>
            </div>
          </Row>

          <div className="mt-4 rounded-md bg-muted p-4 text-xs font-mono text-muted-foreground space-y-1">
            <p>{`<section className="section-dark px-8 py-20">...</section>`}</p>
            <p>{`<div className="bg-fresh-teal-gradient rounded-lg p-6">...</div>`}</p>
          </div>
        </Group>

        {/* ══════════════════════════════════════════════════════════════════
            5. BUTTONS
            shadcn <Button> variants + color overrides
            Workable utilities: .btn-nav-contained / .btn-nav-ghost
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="5 · Buttons — shadcn <Button> variants + Workable utilities">
          {/* — on light bg — */}
          <p className="mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            On light background
          </p>
          <Row>
            <div className="flex flex-col items-center">
              <Button className="rounded-[16px] bg-deep-teal text-white hover:bg-deep-teal/90">
                Primary
              </Button>
              <Cap>bg-deep-teal</Cap>
            </div>
            <div className="flex flex-col items-center">
              <Button className="rounded-[16px] bg-fresh-teal text-midnight-ink hover:bg-fresh-teal/90">
                Accent
              </Button>
              <Cap>bg-fresh-teal</Cap>
            </div>
            <div className="flex flex-col items-center">
              <Button className="rounded-[16px] bg-fresh-teal-gradient text-midnight-ink">
                Gradient
              </Button>
              <Cap>bg-fresh-teal-gradient</Cap>
            </div>
            <div className="flex flex-col items-center">
              <Button
                variant="outline"
                className="rounded-[16px] border-deep-teal text-deep-teal"
              >
                Outline
              </Button>
              <Cap>variant=&quot;outline&quot; border-deep-teal</Cap>
            </div>
            <div className="flex flex-col items-center">
              <Button variant="ghost" className="rounded-[16px]">
                Ghost
              </Button>
              <Cap>variant=&quot;ghost&quot;</Cap>
            </div>
            <div className="flex flex-col items-center">
              <Button variant="destructive" className="rounded-[16px]">
                Destructive
              </Button>
              <Cap>variant=&quot;destructive&quot;</Cap>
            </div>
          </Row>

          {/* — workable utilities — */}
          <p className="mb-3 mt-8 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Workable utility classes (plain &lt;button&gt;)
          </p>
          <Row>
            <div className="flex flex-col items-center">
              <button className="btn-nav-contained">btn-nav-contained</button>
              <Cap>.btn-nav-contained</Cap>
            </div>
            <div className="flex flex-col items-center">
              <button className="btn-nav-ghost">btn-nav-ghost</button>
              <Cap>.btn-nav-ghost</Cap>
            </div>
          </Row>

          {/* — on dark bg — */}
          <p className="mb-3 mt-8 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            On .section-dark background
          </p>
          <div className="section-dark rounded-lg px-8 py-6">
            <Row>
              <div className="flex flex-col items-center">
                <Button className="rounded-[16px] bg-fresh-teal text-midnight-ink hover:bg-fresh-teal/90">
                  Fresh Teal
                </Button>
                <Cap>bg-fresh-teal (preferred on dark)</Cap>
              </div>
              <div className="flex flex-col items-center">
                <Button className="rounded-[16px] bg-fresh-teal-gradient text-midnight-ink">
                  Gradient
                </Button>
                <Cap>bg-fresh-teal-gradient</Cap>
              </div>
              <div className="flex flex-col items-center">
                <Button
                  variant="outline"
                  className="rounded-[16px] border-white/40 text-white hover:bg-white/10"
                >
                  Ghost Outline
                </Button>
                <Cap>variant=&quot;outline&quot; + white border</Cap>
              </div>
              <div className="flex flex-col items-center">
                <button className="btn-nav-contained">Contained</button>
                <Cap>.btn-nav-contained</Cap>
              </div>
            </Row>
          </div>

          <div className="mt-4 rounded-md bg-muted p-4 text-xs font-mono text-muted-foreground space-y-1">
            <p>{`<Button className="rounded-[16px] bg-deep-teal text-white">Primary</Button>`}</p>
            <p>{`<Button className="rounded-[16px] bg-fresh-teal text-midnight-ink">Accent</Button>`}</p>
            <p>{`<Button className="rounded-[16px] bg-fresh-teal-gradient text-midnight-ink">Gradient</Button>`}</p>
            <p>{`<button className="btn-nav-contained">Nav CTA</button>`}</p>
            <p>{`<button className="btn-nav-ghost">Nav Link</button>`}</p>
          </div>
        </Group>

        {/* ══════════════════════════════════════════════════════════════════
            6. BADGES
            Usage: <Badge className="rounded-[25px] border-0 bg-deep-teal text-white">
                   <span className="badge-ghost">tag</span>
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="6 · Badges — shadcn <Badge> + .badge-ghost">
          <Row>
            {(
              [
                ["bg-deep-teal text-white", "deep-teal"],
                ["bg-fresh-teal text-midnight-ink", "fresh-teal"],
                ["bg-soft-peach text-midnight-ink", "soft-peach"],
                ["bg-muted-mandarin text-midnight-ink", "muted-mandarin"],
                ["bg-sky-haze text-midnight-ink", "sky-haze"],
                ["bg-lime-glow text-midnight-ink", "lime-glow"],
                ["bg-spring-bud text-midnight-ink", "spring-bud"],
              ] as [string, string][]
            ).map(([cls, label]) => (
              <div key={label} className="flex flex-col items-center">
                <Badge className={`rounded-[25px] border-0 px-3 ${cls}`}>
                  {label}
                </Badge>
                <Cap>{label}</Cap>
              </div>
            ))}
            <div className="flex flex-col items-center">
              <Badge variant="outline" className="rounded-[25px] px-3">
                outline
              </Badge>
              <Cap>variant=&quot;outline&quot;</Cap>
            </div>
            <div className="flex flex-col items-center">
              <span className="badge-ghost">ghost</span>
              <Cap>.badge-ghost</Cap>
            </div>
          </Row>

          <div className="mt-4 rounded-md bg-muted p-4 text-xs font-mono text-muted-foreground space-y-1">
            <p>{`<Badge className="rounded-[25px] border-0 bg-fresh-teal text-midnight-ink">Tag</Badge>`}</p>
            <p>{`<Badge variant="outline" className="rounded-[25px] px-3">Tag</Badge>`}</p>
            <p>{`<span className="badge-ghost">Tag</span>`}</p>
          </div>
        </Group>

        {/* ══════════════════════════════════════════════════════════════════
            7. INPUTS
            shadcn <Input> — pair with rounded-[8px] (navigation radius)
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="7 · Inputs — shadcn <Input> rounded-[8px]">
          <div className="flex max-w-sm flex-col gap-3">
            <Input placeholder="Default input" className="rounded-[8px]" />
            <Input placeholder="Disabled" className="rounded-[8px]" disabled />
            <div className="flex gap-2">
              <Input placeholder="With button…" className="rounded-[8px]" />
              <Button className="shrink-0 rounded-[16px] bg-deep-teal text-white hover:bg-deep-teal/90">
                Go
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-muted p-4 text-xs font-mono text-muted-foreground space-y-1">
            <p>{`<Input placeholder="..." className="rounded-[8px]" />`}</p>
            <p>{`// inputs use rounded-[8px] (navigation radius)`}</p>
            <p>{`// buttons pair with rounded-[16px] (card/button radius)`}</p>
          </div>
        </Group>

        {/* ══════════════════════════════════════════════════════════════════
            8. DARK MODE — what changes automatically via CSS variables
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="8 · Dark mode — what the .dark class changes automatically">
          <p className="mb-4 text-body-sm text-muted-foreground">
            Toggle the theme (top right) to see these switch. All shadcn
            semantic tokens re-map automatically — you don&apos;t need dark:
            variants for base UI.
          </p>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(
              [
                ["bg-background", "background\n(porcelain → forest canopy)"],
                ["bg-card", "card\n(white → deep teal)"],
                ["bg-primary", "primary\n(deep teal → fresh teal)"],
                ["bg-accent", "accent\n(fresh teal → lime glow)"],
                ["bg-muted", "muted\n(soft peach → muted sage)"],
                ["bg-secondary", "secondary\n(soft peach → muted sage)"],
                ["bg-destructive", "destructive\n(same red)"],
                [
                  "border-border bg-transparent border-2 h-10",
                  "border\n(dark → white/15)",
                ],
              ] as [string, string][]
            ).map(([cls, label]) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`h-10 w-full rounded-md ${cls}`} />
                <Cap>{label}</Cap>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md bg-muted p-4 text-xs font-mono text-muted-foreground space-y-1">
            <p>{`// These just work in both modes — no dark: prefix needed:`}</p>
            <p>{`<div className="bg-background text-foreground" />`}</p>
            <p>{`<div className="bg-card text-card-foreground" />`}</p>
            <p>{`<div className="bg-primary text-primary-foreground" />`}</p>
          </div>
        </Group>

        {/* ══════════════════════════════════════════════════════════════════
            9. BORDER RADIUS
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="9 · Border radius — when to use which">
          <Row>
            {(
              [
                [
                  "rounded-[8px]",
                  "8px — inputs, nav items\n--radius-navigation",
                ],
                [
                  "rounded-[16px]",
                  "16px — cards, buttons\n--radius-cards / --radius-buttons",
                ],
                ["rounded-[25px]", "25px — badges\n--radius-badges"],
                ["rounded-full", "full — avatars, pills"],
              ] as [string, string][]
            ).map(([cls, label]) => (
              <div key={cls} className="flex flex-col items-center">
                <div className={`h-10 w-24 bg-deep-teal ${cls}`} />
                <Cap>{label}</Cap>
              </div>
            ))}
          </Row>
        </Group>

        {/* ══════════════════════════════════════════════════════════════════
            10. SPACING
        ════════════════════════════════════════════════════════════════════ */}
        <Group title="10 · Spacing tokens — var(--spacing-*)">
          <div className="flex flex-col gap-2">
            {(
              [
                ["--spacing-8", "8px", "element gap"],
                ["--spacing-16", "16px", "tight gap"],
                ["--spacing-24", "24px", "inner padding"],
                [
                  "--spacing-32",
                  "32px",
                  "card padding (.card-* classes use this)",
                ],
                ["--spacing-40", "40px", "section padding"],
                ["--spacing-64", "64px", "section gap"],
                ["--spacing-88", "88px", "large section"],
                ["--spacing-104", "104px", "hero padding"],
              ] as [string, string, string][]
            ).map(([token, val, note]) => (
              <div key={token} className="flex items-center gap-4">
                <code className="w-36 shrink-0 text-[10px] text-muted-foreground">
                  {token}
                </code>
                <div
                  className="h-5 shrink-0 rounded-sm bg-deep-teal"
                  style={{ width: val }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {val} — {note}
                </span>
              </div>
            ))}
          </div>
        </Group>
      </main>
    </div>
  );
};

export default SamplePage;
