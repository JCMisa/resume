/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Briefcase } from "lucide-react";
import RichField from "../rich/RichField";
import { AiBulletsAssist } from "../ai/AiAssists";

interface ExperienceFormProps {
  data: any[];
  onChange: (val: any[]) => void;
}

export default function ExperienceForm({
  data,
  onChange,
}: ExperienceFormProps) {
  const handleExpChange = (index: number, key: string, value: string) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  const addExperience = () => {
    onChange([
      ...data,
      {
        id: globalThis.crypto.randomUUID(),
        company: "",
        role: "",
        duration: "",
        bullets: [""],
      },
    ]);
  };

  const removeExperience = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(data.filter((item) => item.id !== id));
  };

  // Bullets are one rich field: Enter adds a bullet, Backspace on an empty one removes it
  const setBullets = (index: number, bullets: string[]) => {
    onChange(data.map((item, i) => (i === index ? { ...item, bullets } : item)));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Work History Timeline
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addExperience}
          className="rounded-lg font-bold gap-1"
        >
          <Plus className="h-3 w-3" /> Add Employment
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-xs text-muted-foreground bg-muted/10">
          No work experiences added. Click above to record a job role.
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-3 border-none"
        >
          {data.map((exp, index) => (
            <AccordionItem
              key={exp.id}
              value={exp.id}
              className="border rounded-2xl bg-card px-4 py-1 shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4 text-left">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold truncate">
                        {exp.role || "Untitled Position"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {exp.company || "No Company Specified"}
                      </p>
                    </div>
                  </div>
                  <div
                    onClick={(e) => removeExperience(exp.id, e)}
                    className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0 h-8 w-8 ml-2 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-2 pb-4 space-y-4 overflow-y-auto !no-scrollbar border-t border-dashed border-border/60">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      Role Title
                    </span>
                    <Input
                      placeholder="Front-End Developer"
                      value={exp.role || ""}
                      onChange={(e) =>
                        handleExpChange(index, "role", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      Company / Client
                    </span>
                    <Input
                      placeholder="Your Company Name"
                      value={exp.company || ""}
                      onChange={(e) =>
                        handleExpChange(index, "company", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    Duration / Timeline
                  </span>
                  <Input
                    placeholder="July 2025 - Present"
                    value={exp.duration || ""}
                    onChange={(e) =>
                      handleExpChange(index, "duration", e.target.value)
                    }
                    className="rounded-xl h-9"
                  />
                </div>

                {/* Bullets: one rich field (bold/italic/underline/links) */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    Responsibilities & Key Metrics
                  </span>
                  <RichField
                    kind="bullets"
                    toolbar="inline"
                    value={exp.bullets ?? [""]}
                    onChange={(v) => setBullets(index, v as string[])}
                    ariaLabel={`${exp.role || "Job"} bullet points`}
                    placeholder="Reduced load times by 30% by…"
                  />
                  <p className="text-[11px] text-muted-foreground">Press Enter for a new bullet. Start with a verb and add a number.</p>
                  <AiBulletsAssist
                    section="experience"
                    index={index}
                    hasBullets={(exp.bullets ?? []).some((b: string) => b.trim())}
                    onUse={(bullets, mode) =>
                      setBullets(index, mode === "add" ? [...(exp.bullets ?? []).filter((b: string) => b.trim()), ...bullets] : bullets)
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
