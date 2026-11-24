"use client";

import React from "react";
import RichField from "../rich/RichField";

interface SummaryFormProps {
  data: string;
  onChange: (val: string) => void;
}

export default function SummaryForm({ data, onChange }: SummaryFormProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Professional Summary (Optional)
        </label>
        <RichField
          kind="paragraphs"
          toolbar="inline"
          value={data}
          onChange={(v) => onChange(v as string)}
          ariaLabel="Professional summary"
          placeholder="Full-stack developer specializing in fast web apps and AI integrations…"
          className="[&_.rich-field]:min-h-48"
        />
        <p className="text-[11px] text-muted-foreground italic">
          Tip: Write a short, punchy paragraph (3-4 sentences) highlighting your
          core expertise and engineering focus.
        </p>
      </div>
    </div>
  );
}
