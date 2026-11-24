"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";

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
        <Textarea
          placeholder="Passionate Full-Stack Developer specializing in high-performance web applications and AI integrations..."
          value={data}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl min-h-[200px] resize-none leading-relaxed"
        />
        <p className="text-[11px] text-muted-foreground italic">
          Tip: Write a short, punchy paragraph (3-4 sentences) highlighting your
          core expertise and engineering focus.
        </p>
      </div>
    </div>
  );
}
