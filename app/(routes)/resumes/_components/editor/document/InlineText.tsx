"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Single-line, plain-text editable span used on the resume page in document
 * mode (names, roles, dates, headings). Looks exactly like the printed text.
 * The DOM is only rewritten from `value` when the field isn't focused, so the
 * caret never jumps while typing.
 */
export default function InlineText({
  value,
  onChange,
  placeholder,
  ariaLabel,
  maxLength = 200,
  className,
  style,
  as: Tag = "span",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  maxLength?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: "span" | "div";
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value;
  }, [value]);

  return (
    <Tag
      ref={ref as never}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel}
      data-inline-text=""
      data-placeholder={placeholder}
      spellCheck
      className={cn(
        "outline-none rounded-[2px] focus:bg-amber-100/60 hover:bg-stone-100 cursor-text min-w-[1ch] inline-block",
        className,
      )}
      style={style}
      onInput={(e) => {
        const el = e.currentTarget;
        let text = (el.textContent ?? "").replace(/\n/g, " ");
        if (text.length > maxLength) {
          text = text.slice(0, maxLength);
          el.textContent = text;
        }
        onChange(text);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onPaste={(e) => {
        // Plain text only, on one line (Firefox ignores plaintext-only on old versions)
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g, " ");
        document.execCommand("insertText", false, text);
      }}
      onBlur={(e) => {
        const el = e.currentTarget;
        if (el.textContent !== value) el.textContent = value;
      }}
    />
  );
}
