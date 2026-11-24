"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { Extension } from "@tiptap/core";
import { cn } from "@/lib/utils";
import { bulletsToDoc, docToBullets, docToRich, richToDoc, safeLinkUrl } from "@/lib/rich-text";
import FormatButtons from "./FormatButtons";

// One Tiptap-based rich text field, used by both editor modes. Values are the
// markup strings from lib/rich-text.ts, so the data model stays plain strings.
//
// kinds:  inline     one paragraph (certificate description)
//         paragraphs several paragraphs, no lists (summary)
//         blocks     paragraphs + bullet lists (custom sections)
//         bullets    string[]; one paragraph per bullet (experience, projects)

export type RichKind = "inline" | "paragraphs" | "blocks" | "bullets";

/** The focused field, so a shared toolbar (document mode) can format it. */
const ActiveEditorCtx = createContext<{ active: Editor | null; setActive: (e: Editor | null) => void } | null>(null);

export function ActiveEditorProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<Editor | null>(null);
  const value = useMemo(() => ({ active, setActive }), [active]);
  return <ActiveEditorCtx.Provider value={value}>{children}</ActiveEditorCtx.Provider>;
}

export const useActiveEditor = () => useContext(ActiveEditorCtx)?.active ?? null;

const SingleLine = Extension.create({
  name: "singleLine",
  addKeyboardShortcuts: () => ({ Enter: () => true, "Shift-Enter": () => true }),
});

function toDoc(kind: RichKind, value: string | string[]) {
  if (kind === "bullets") return bulletsToDoc(Array.isArray(value) ? value : [value]);
  return richToDoc(Array.isArray(value) ? value.join("\n") : value, { lists: kind === "blocks" });
}

function fromDoc(kind: RichKind, json: Parameters<typeof docToRich>[0]): string | string[] {
  if (kind === "bullets") return docToBullets(json);
  const v = docToRich(json);
  return kind === "inline" ? v.replace(/\n/g, " ") : v;
}

type Props = {
  kind: RichKind;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  /** "inline": a small toolbar above the field while it has focus (assist mode) */
  toolbar?: "inline" | "none";
  /** Look: "input" = bordered form field; "bare" = text on the resume page */
  appearance?: "input" | "bare";
  className?: string;
  style?: React.CSSProperties;
  ariaLabel: string;
};

export default function RichField({
  kind,
  value,
  onChange,
  placeholder,
  toolbar = "none",
  appearance = "input",
  className,
  style,
  ariaLabel,
}: Props) {
  const ctx = useContext(ActiveEditorCtx);
  const [focused, setFocused] = useState(false);
  const lastEmitted = useRef<string>(JSON.stringify(value));
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const editor = useEditor({
    immediatelyRender: false, // rendered on the client only (no SSR mismatch)
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        orderedList: false,
        hardBreak: false,
        trailingNode: false,
        bulletList: kind === "blocks" ? {} : false,
        listItem: kind === "blocks" ? {} : false,
        listKeymap: kind === "blocks" ? {} : false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          isAllowedUri: (url) => Boolean(safeLinkUrl(url)),
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "", showOnlyCurrent: false }),
      ...(kind === "inline" ? [SingleLine] : []),
    ],
    content: toDoc(kind, value),
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
        "aria-multiline": kind === "inline" ? "false" : "true",
        role: "textbox",
        class: "outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const next = fromDoc(kind, editor.getJSON());
      lastEmitted.current = JSON.stringify(next);
      onChangeRef.current(next);
    },
    onFocus: ({ editor }) => {
      setFocused(true);
      ctx?.setActive(editor);
    },
    onBlur: () => setFocused(false),
  });

  // Outside changes (another mode, a structural edit): load them, but never
  // while the user is typing here
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const incoming = JSON.stringify(value);
    if (incoming === lastEmitted.current) return;
    lastEmitted.current = incoming;
    editor.commands.setContent(toDoc(kind, value), { emitUpdate: false });
  }, [editor, kind, value]);

  // Forget this field in the shared toolbar when it goes away
  useEffect(() => {
    return () => {
      if (editor && ctx?.active === editor) ctx.setActive(null);
    };
  }, [editor, ctx]);

  return (
    <div className={cn("relative", className)} style={style}>
      {toolbar === "inline" && editor && (
        <div
          className={cn(
            "mb-1 transition-opacity",
            focused ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden mb-0",
          )}
          // Keep focus in the editor while clicking toolbar buttons
          onMouseDown={(e) => e.preventDefault()}
        >
          <FormatButtons editor={editor} lists={kind === "blocks"} size="sm" />
        </div>
      )}
      <EditorContent
        editor={editor}
        className={cn(
          "rich-field",
          kind === "bullets" && "rich-bullets",
          appearance === "input" &&
            "rounded-xl border bg-transparent px-3 py-2 text-sm leading-relaxed focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          appearance === "input" && kind !== "inline" && "min-h-20",
        )}
      />
    </div>
  );
}
