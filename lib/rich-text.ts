// Inline rich text for resume fields (summary, bullets, descriptions, custom
// sections), stored as a tiny markup inside the existing string fields so the
// data model, ATS checks, AI prompts and job matching keep working:
//
//   **bold**   *italic*   __underline__   [label](https://url)
//   "- " at the start of a line = bullet (only where lists are allowed)
//   \* \_ \[ \] \\ = literal characters
//
// Pure + unit-tested (tests/rich-text.test.ts). Used by both renderers
// (screen + PDF), the Tiptap editor fields, and stripRich() for plain text.


/** Only http(s) and mailto links are made clickable. */
export function safeLinkUrl(url: string): string | null {
  const u = url.trim();
  if (/^mailto:/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(u)) return `https://${u}`;
  return null;
}

export type Span = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; href?: string };
export type RichBlock = { type: "paragraph" | "bullet"; spans: Span[] };

const ESCAPABLE = /[\\*_[\]]/g;
export const escapeRich = (text: string) => text.replace(ESCAPABLE, "\\$&");

type Token =
  | { t: "text"; v: string }
  | { t: "mark"; m: "bold" | "italic" | "underline"; raw: string; paired?: boolean }
  | { t: "link"; label: Token[]; href: string };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ t: "text", v: buf });
    buf = "";
  };
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\" && i + 1 < src.length && /[\\*_[\]]/.test(src[i + 1])) {
      buf += src[i + 1];
      i += 2;
    } else if (src.startsWith("**", i)) {
      flush();
      out.push({ t: "mark", m: "bold", raw: "**" });
      i += 2;
    } else if (src.startsWith("__", i)) {
      flush();
      out.push({ t: "mark", m: "underline", raw: "__" });
      i += 2;
    } else if (c === "*") {
      flush();
      out.push({ t: "mark", m: "italic", raw: "*" });
      i += 1;
    } else if (c === "[") {
      // [label](href): find the closing "](" and ")" (label may contain escapes)
      let j = i + 1;
      while (j < src.length && src[j] !== "]") j += src[j] === "\\" ? 2 : 1;
      const close = src.indexOf(")", j);
      if (src[j] === "]" && src[j + 1] === "(" && close > j) {
        flush();
        out.push({ t: "link", label: tokenize(src.slice(i + 1, j)), href: src.slice(j + 2, close).trim() });
        i = close + 1;
      } else {
        buf += c;
        i += 1;
      }
    } else {
      buf += c;
      i += 1;
    }
  }
  flush();
  return out;
}

/** Pair markers; any marker without a partner is plain text (typing "5*" stays "5*"). */
function pair(tokens: Token[]) {
  const open: Partial<Record<"bold" | "italic" | "underline", number>> = {};
  tokens.forEach((tok, i) => {
    if (tok.t !== "mark") return;
    const o = open[tok.m];
    if (o === undefined) open[tok.m] = i;
    else {
      (tokens[o] as Extract<Token, { t: "mark" }>).paired = true;
      tok.paired = true;
      delete open[tok.m];
    }
  });
}

function toSpans(tokens: Token[], base: Omit<Span, "text">, out: Span[]) {
  pair(tokens);
  const active = { ...base };
  for (const tok of tokens) {
    if (tok.t === "text") out.push({ ...active, text: tok.v });
    else if (tok.t === "mark") {
      if (tok.paired) active[tok.m] = !active[tok.m];
      else out.push({ ...active, text: tok.raw });
    } else {
      const href = safeLinkUrl(tok.href) ?? undefined;
      toSpans(tok.label, { ...active, href }, out);
    }
  }
  return out;
}

/** Merge neighbours with identical formatting and drop empty spans. */
export function normalizeSpans(spans: Span[]): Span[] {
  const out: Span[] = [];
  for (const s of spans) {
    if (!s.text) continue;
    const prev = out[out.length - 1];
    const same =
      prev &&
      !!prev.bold === !!s.bold &&
      !!prev.italic === !!s.italic &&
      !!prev.underline === !!s.underline &&
      prev.href === s.href;
    if (same) prev.text += s.text;
    else {
      const clean: Span = { text: s.text };
      if (s.bold) clean.bold = true;
      if (s.italic) clean.italic = true;
      if (s.underline) clean.underline = true;
      if (s.href) clean.href = s.href;
      out.push(clean);
    }
  }
  return out;
}

export function parseInline(src: string): Span[] {
  return normalizeSpans(toSpans(tokenize(src ?? ""), {}, []));
}

export function serializeInline(spans: Span[]): string {
  return normalizeSpans(spans)
    .map((s) => {
      let t = escapeRich(s.text);
      if (s.italic) t = `*${t}*`;
      if (s.underline) t = `__${t}__`;
      if (s.bold) t = `**${t}**`;
      if (s.href) t = `[${t}](${s.href.replace(/\)/g, "%29").replace(/\s/g, "%20")})`;
      return t;
    })
    .join("");
}

/** Lines -> paragraphs / bullets. Bullets only where `lists` is allowed. */
export function parseBlocks(src: string, { lists = false } = {}): RichBlock[] {
  return (src ?? "")
    .split("\n")
    .map((line) =>
      lists && /^\s*[-•]\s+/.test(line)
        ? { type: "bullet" as const, spans: parseInline(line.replace(/^\s*[-•]\s+/, "")) }
        : { type: "paragraph" as const, spans: parseInline(line) },
    );
}

export function serializeBlocks(blocks: RichBlock[]): string {
  return blocks.map((b) => (b.type === "bullet" ? "- " : "") + serializeInline(b.spans)).join("\n");
}

/** Visible text without markup (ATS checks, AI prompts, previews). */
export function stripRich(src: string | undefined | null): string {
  if (!src) return "";
  return parseBlocks(src, { lists: true })
    .map((b) => (b.type === "bullet" ? "• " : "") + b.spans.map((s) => s.text).join(""))
    .join("\n");
}

/** Blocks with visible text (empty lines dropped). */
export const nonEmptyBlocks = (blocks: RichBlock[]) => blocks.filter((b) => b.spans.some((s) => s.text.trim()));

// ── Tiptap JSON <-> markup (shape only; no Tiptap import needed) ───────────

type PMMark = { type: string; attrs?: Record<string, unknown> };
type PMNode = { type: string; text?: string; marks?: PMMark[]; content?: PMNode[]; attrs?: Record<string, unknown> };

function spansToNodes(spans: Span[]): PMNode[] {
  return spans.map((s) => {
    const marks: PMMark[] = [];
    if (s.bold) marks.push({ type: "bold" });
    if (s.italic) marks.push({ type: "italic" });
    if (s.underline) marks.push({ type: "underline" });
    if (s.href) marks.push({ type: "link", attrs: { href: s.href } });
    return marks.length ? { type: "text", text: s.text, marks } : { type: "text", text: s.text };
  });
}

function nodesToSpans(nodes: PMNode[] | undefined): Span[] {
  const out: Span[] = [];
  for (const n of nodes ?? []) {
    if (n.type === "text" && n.text) {
      const has = (t: string) => n.marks?.some((m) => m.type === t);
      const link = n.marks?.find((m) => m.type === "link");
      const href = typeof link?.attrs?.href === "string" ? safeLinkUrl(link.attrs.href) ?? undefined : undefined;
      out.push({ text: n.text, bold: has("bold"), italic: has("italic"), underline: has("underline"), href });
    } else if (n.type === "hardBreak") {
      out.push({ text: " " });
    }
  }
  return normalizeSpans(out);
}

const paragraph = (spans: Span[]): PMNode => {
  const content = spansToNodes(spans);
  return content.length ? { type: "paragraph", content } : { type: "paragraph" };
};
const listItem = (spans: Span[]): PMNode => ({ type: "listItem", content: [paragraph(spans)] });

/** Field value -> Tiptap document. */
export function richToDoc(value: string, { lists = false } = {}): PMNode {
  const content: PMNode[] = [];
  for (const block of parseBlocks(value, { lists })) {
    if (block.type === "bullet") {
      const last = content[content.length - 1];
      if (last?.type === "bulletList") last.content!.push(listItem(block.spans));
      else content.push({ type: "bulletList", content: [listItem(block.spans)] });
    } else content.push(paragraph(block.spans));
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/** Tiptap document -> field value (paragraphs joined by newlines). */
export function docToRich(doc: PMNode): string {
  const blocks: RichBlock[] = [];
  for (const node of doc.content ?? []) {
    if (node.type === "bulletList" || node.type === "orderedList") {
      for (const item of node.content ?? []) {
        for (const p of item.content ?? []) blocks.push({ type: "bullet", spans: nodesToSpans(p.content) });
      }
    } else blocks.push({ type: "paragraph", spans: nodesToSpans(node.content) });
  }
  // Drop trailing empty paragraphs the editor adds
  while (blocks.length > 1 && !blocks[blocks.length - 1].spans.length && blocks[blocks.length - 1].type === "paragraph") {
    blocks.pop();
  }
  return serializeBlocks(blocks);
}

/**
 * Bullet list field (string[]) -> Tiptap document: one paragraph per bullet
 * (the editor draws the bullet markers), so Enter adds a bullet and
 * Backspace on an empty one removes it.
 */
export function bulletsToDoc(bullets: string[]): PMNode {
  return { type: "doc", content: (bullets.length ? bullets : [""]).map((b) => paragraph(parseInline(b))) };
}

/** Tiptap document -> bullets (every paragraph, listed or not, is one bullet). */
export function docToBullets(doc: PMNode): string[] {
  const out: string[] = [];
  const walk = (nodes: PMNode[] | undefined) => {
    for (const n of nodes ?? []) {
      if (n.type === "paragraph") out.push(serializeInline(nodesToSpans(n.content)));
      else walk(n.content);
    }
  };
  walk(doc.content);
  return out;
}

// ── Plain content for AI prompts and ATS checks ─────────────────────────────

type ContentLike = {
  professionalSummary?: string;
  experiences?: { bullets: string[] }[];
  projects?: { description: string[] }[];
  certificates?: { description?: string }[];
  customSections?: { title: string; body: string }[];
  design?: unknown;
};

/**
 * The same content with formatting markup removed from every rich field and
 * the editor-only look settings dropped. Gemini, the ATS checks and job
 * matching only ever see clean text.
 */
export function toPlainContent<T extends ContentLike>(content: T): T {
  const plainLine = (s: string) => stripRich(s).replace(/^•\s/, "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { design, ...rest } = content;
  return {
    ...rest,
    professionalSummary: stripRich(content.professionalSummary),
    experiences: content.experiences?.map((e) => ({ ...e, bullets: e.bullets.map(plainLine) })),
    projects: content.projects?.map((p) => ({ ...p, description: p.description.map(plainLine) })),
    certificates: content.certificates?.map((c) => ({ ...c, description: c.description ? stripRich(c.description) : c.description })),
    customSections: content.customSections?.map((c) => ({ ...c, body: stripRich(c.body) })),
  } as T;
}
