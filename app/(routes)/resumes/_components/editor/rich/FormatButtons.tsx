"use client";

import { useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { Bold, Italic, Link2, Link2Off, List, Redo2, Underline, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { safeLinkUrl } from "@/lib/rich-text";

function ToolButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
  size,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size: "sm" | "md";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the editor's selection
      onClick={onClick}
      className={cn(
        "rounded-md flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none",
        size === "sm" ? "size-7" : "size-8",
        active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Bold / italic / underline / link (/ list) for one Tiptap editor (or none: disabled). */
export default function FormatButtons({
  editor,
  lists = false,
  history = false,
  size = "md",
}: {
  editor: Editor | null;
  lists?: boolean;
  history?: boolean;
  size?: "sm" | "md";
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            link: e.isActive("link"),
            list: e.isActive("bulletList"),
            canList: e.can().toggleBulletList?.() ?? false,
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const icon = size === "sm" ? "size-3.5" : "size-4";
  const off = !editor;

  function openLink() {
    if (!editor) return;
    setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setError(null);
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const href = safeLinkUrl(url);
    if (!href) {
      setError("Enter a web address (https://…) or an email (mailto:…).");
      return;
    }
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !editor.isActive("link")) {
      // Nothing selected: insert the address as the link text
      chain.insertContent({ type: "text", text: url.replace(/^https?:\/\//, ""), marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      chain.setLink({ href }).run();
    }
    setLinkOpen(false);
  }

  return (
    <div className="flex items-center gap-0.5" role="toolbar" aria-label="Text formatting">
      {history && (
        <>
          <ToolButton size={size} label="Undo" shortcut="Ctrl+Z" disabled={off || !state?.canUndo} onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 className={icon} />
          </ToolButton>
          <ToolButton size={size} label="Redo" shortcut="Ctrl+Shift+Z" disabled={off || !state?.canRedo} onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 className={icon} />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        </>
      )}
      <ToolButton size={size} label="Bold" shortcut="Ctrl+B" active={state?.bold} disabled={off} onClick={() => editor?.chain().focus().toggleBold().run()}>
        <Bold className={icon} />
      </ToolButton>
      <ToolButton size={size} label="Italic" shortcut="Ctrl+I" active={state?.italic} disabled={off} onClick={() => editor?.chain().focus().toggleItalic().run()}>
        <Italic className={icon} />
      </ToolButton>
      <ToolButton size={size} label="Underline" shortcut="Ctrl+U" active={state?.underline} disabled={off} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
        <Underline className={icon} />
      </ToolButton>
      <ToolButton size={size} label={state?.link ? "Edit link" : "Add link"} active={state?.link} disabled={off} onClick={openLink}>
        <Link2 className={icon} />
      </ToolButton>
      {state?.link && (
        <ToolButton size={size} label="Remove link" disabled={off} onClick={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}>
          <Link2Off className={icon} />
        </ToolButton>
      )}
      {lists && (
        <ToolButton size={size} label="Bullet list" active={state?.list} disabled={off || !state?.canList} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List className={icon} />
        </ToolButton>
      )}

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-sm" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{state?.link ? "Edit link" : "Add link"}</DialogTitle>
            <DialogDescription>Links stay clickable in the downloaded PDF.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
            className="space-y-2"
          >
            <Input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/you"
              aria-label="Link address"
              aria-invalid={Boolean(error)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setLinkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
