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
import { Plus, Trash2, GraduationCap } from "lucide-react";

interface EducationFormProps {
  data: any[];
  onChange: (val: any[]) => void;
}

export default function EducationForm({ data, onChange }: EducationFormProps) {
  const handleEduChange = (index: number, key: string, value: string) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  const addEducation = () => {
    onChange([
      ...data,
      {
        id: globalThis.crypto.randomUUID(),
        schoolName: "",
        course: "",
        major: "",
        duration: "",
        gwa: "",
      },
    ]);
  };

  const removeEducation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(data.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Academic Profile
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEducation}
          className="rounded-lg text-[11px] font-bold h-7 gap-1"
        >
          <Plus className="h-3 w-3" /> Add Academic Node
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-xs text-muted-foreground bg-muted/10">
          No education profiles added. Click above to document a school
          timeline.
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-3 border-none"
        >
          {data.map((edu, index) => (
            <AccordionItem
              key={edu.id}
              value={edu.id}
              className="border rounded-2xl bg-card px-4 py-1 shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4 text-left">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold truncate">
                      {edu.course || "Degree/Course Title"}
                    </span>
                  </div>
                  <div
                    onClick={(e) => removeEducation(edu.id, e)}
                    className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0 h-8 w-8 ml-2 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4 border-t border-dashed border-border/60 overflow-y-auto !no-scrollbar">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      Institution / School Name
                    </span>
                    <Input
                      placeholder="Laguna State Polytechnic University"
                      value={edu.schoolName || ""}
                      onChange={(e) =>
                        handleEduChange(index, "schoolName", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      Course / Degree Specification
                    </span>
                    <Input
                      placeholder="BS Information Technology"
                      value={edu.course || ""}
                      onChange={(e) =>
                        handleEduChange(index, "course", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      School Years Timeline
                    </span>
                    <Input
                      placeholder="2022 - 2026"
                      value={edu.duration || ""}
                      onChange={(e) =>
                        handleEduChange(index, "duration", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      Grade / GWA
                    </span>
                    <Input
                      placeholder="1.50"
                      value={edu.gwa || ""}
                      onChange={(e) =>
                        handleEduChange(index, "gwa", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
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
