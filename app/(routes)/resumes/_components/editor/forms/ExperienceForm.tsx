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

  const handleBulletChange = (
    expIndex: number,
    bIndex: number,
    value: string,
  ) => {
    const updated = [...data];
    updated[expIndex].bullets[bIndex] = value;
    onChange(updated);
  };

  const addBulletField = (expIndex: number) => {
    const updated = [...data];
    updated[expIndex].bullets.push("");
    onChange(updated);
  };

  const removeBulletField = (expIndex: number, bIndex: number) => {
    const updated = [...data];
    updated[expIndex].bullets = updated[expIndex].bullets.filter(
      (_: any, i: number) => i !== bIndex,
    );
    onChange(updated);
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
          className="rounded-lg text-[11px] font-bold h-7 gap-1"
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

                {/* BULLETS REPEATABLE SUB SECTION */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      Responsibilities & Key Metrics
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addBulletField(index)}
                      className="h-6 rounded-lg text-[10px] font-bold gap-0.5 px-2"
                    >
                      <Plus className="h-3 w-3" /> Add Bullet
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {exp.bullets?.map((bullet: string, bIdx: number) => (
                      <div
                        key={bIdx}
                        className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-200"
                      >
                        <Input
                          placeholder="Reduced initial application load times by 30% through vector code optimizations..."
                          value={bullet || ""}
                          onChange={(e) =>
                            handleBulletChange(index, bIdx, e.target.value)
                          }
                          className="rounded-xl h-8 text-xs flex-grow"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBulletField(index, bIdx)}
                          className="text-destructive hover:bg-destructive/10 h-7 w-7 rounded-lg shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
