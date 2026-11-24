import React from "react";
import { nonEmptyBlocks, parseBlocks, parseInline, safeLinkUrl, type Span } from "@/lib/rich-text";

// On-screen rendering of the inline markup in lib/rich-text.ts.

export function RichSpans({ spans, linkStyle }: { spans: Span[]; linkStyle?: React.CSSProperties }) {
  return (
    <>
      {spans.map((s, i) => {
        let node: React.ReactNode = s.text;
        if (s.underline) node = <u>{node}</u>;
        if (s.italic) node = <em>{node}</em>;
        if (s.bold) node = <strong style={{ fontWeight: 700 }}>{node}</strong>;
        const href = s.href ? safeLinkUrl(s.href) : null;
        if (href) {
          node = (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow" style={linkStyle}>
              {node}
            </a>
          );
        }
        return <React.Fragment key={i}>{node}</React.Fragment>;
      })}
    </>
  );
}

export function RichInline({ value, linkStyle }: { value: string; linkStyle?: React.CSSProperties }) {
  return <RichSpans spans={parseInline(value)} linkStyle={linkStyle} />;
}

/** Paragraphs (and bullets, where `lists`) from a multi-line field. */
export function RichBlocks({
  value,
  lists = false,
  paragraphStyle,
  listStyle,
  itemStyle,
  linkStyle,
}: {
  value: string;
  lists?: boolean;
  paragraphStyle?: React.CSSProperties;
  listStyle?: React.CSSProperties;
  itemStyle?: React.CSSProperties;
  linkStyle?: React.CSSProperties;
}) {
  const blocks = nonEmptyBlocks(parseBlocks(value, { lists }));
  const out: React.ReactNode[] = [];
  let bullets: React.ReactNode[] = [];
  const flushList = () => {
    if (bullets.length) out.push(<ul key={`l${out.length}`} style={listStyle}>{bullets}</ul>);
    bullets = [];
  };
  blocks.forEach((b, i) => {
    if (b.type === "bullet") {
      bullets.push(
        <li key={i} style={itemStyle}>
          <RichSpans spans={b.spans} linkStyle={linkStyle} />
        </li>,
      );
    } else {
      flushList();
      out.push(
        <p key={i} style={paragraphStyle}>
          <RichSpans spans={b.spans} linkStyle={linkStyle} />
        </p>,
      );
    }
  });
  flushList();
  return <>{out}</>;
}
