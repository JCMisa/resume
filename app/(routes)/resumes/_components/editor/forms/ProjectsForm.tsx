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
import { Plus, Trash2, Code, Link2 } from "lucide-react";

interface ProjectsFormProps {
  data: any[];
  onChange: (val: any[]) => void;
}

export default function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const handleProjChange = (index: number, key: string, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  const addProject = () => {
    onChange([
      ...data,
      {
        id: globalThis.crypto.randomUUID(),
        title: "",
        duration: "",
        description: [""],
        links: [{ label: "", url: "" }],
      },
    ]);
  };

  const removeProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(data.filter((item) => item.id !== id));
  };

  const handleDescChange = (
    projIndex: number,
    dIndex: number,
    value: string,
  ) => {
    const updated = [...data];
    updated[projIndex].description[dIndex] = value;
    onChange(updated);
  };

  const addDescField = (projIndex: number) => {
    const updated = [...data];
    updated[projIndex].description.push("");
    onChange(updated);
  };

  const removeDescField = (projIndex: number, dIndex: number) => {
    const updated = [...data];
    updated[projIndex].description = updated[projIndex].description.filter(
      (_: any, i: number) => i !== dIndex,
    );
    onChange(updated);
  };

  const handleLinkChange = (
    projIndex: number,
    lIdx: number,
    key: string,
    value: string,
  ) => {
    const updated = [...data];
    if (!updated[projIndex].links) updated[projIndex].links = [];
    updated[projIndex].links[lIdx] = {
      ...updated[projIndex].links[lIdx],
      [key]: value,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Professional Projects
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addProject}
          className="rounded-lg text-[11px] font-bold h-7 gap-1"
        >
          <Plus className="h-3 w-3" /> Add Project
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-xs text-muted-foreground bg-muted/10">
          No engineering projects added. Click above to log an app build.
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-3 border-none"
        >
          {data.map((proj, index) => (
            <AccordionItem
              key={proj.id}
              value={proj.id}
              className="border rounded-2xl bg-card px-4 py-1 shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4 text-left">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                      <Code className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold truncate">
                      {proj.title || "Untitled Project Application"}
                    </span>
                  </div>
                  <div
                    onClick={(e) => removeProject(proj.id, e)}
                    className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0 h-8 w-8 ml-2 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4 border-t border-dashed border-border/60 overflow-y-auto !no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      Project Title
                    </span>
                    <Input
                      placeholder="Kognit Task Engine"
                      value={proj.title || ""}
                      onChange={(e) =>
                        handleProjChange(index, "title", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      Timeline Date
                    </span>
                    <Input
                      placeholder="April 2026"
                      value={proj.duration || ""}
                      onChange={(e) =>
                        handleProjChange(index, "duration", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                </div>

                {/* DESCRIPTION ACTIONS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary uppercase">
                      Feature Scope Bullet Points
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDescField(index)}
                      className="h-6 rounded-lg text-[10px] font-bold gap-0.5 px-2"
                    >
                      <Plus className="h-3 w-3" /> Add Detail
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {proj.description?.map((desc: string, dIdx: number) => (
                      <div
                        key={dIdx}
                        className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-200"
                      >
                        <Input
                          placeholder="Integrated Vapi voice systems establishing conversational automation flows..."
                          value={desc || ""}
                          onChange={(e) =>
                            handleDescChange(index, dIdx, e.target.value)
                          }
                          className="rounded-xl h-8 text-xs flex-grow"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDescField(index, dIdx)}
                          className="text-destructive hover:bg-destructive/10 h-7 w-7 rounded-lg shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PROJECT ATTACHED LINKS ROW */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Deployment/Repository Link
                    (Optional)
                  </span>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Label (e.g., Live App)"
                      value={proj.links?.[0]?.label || ""}
                      onChange={(e) =>
                        handleLinkChange(index, 0, "label", e.target.value)
                      }
                      className="rounded-xl h-9 text-xs flex-1"
                    />
                    <Input
                      placeholder="URL (https://...)"
                      value={proj.links?.[0]?.url || ""}
                      onChange={(e) =>
                        handleLinkChange(index, 0, "url", e.target.value)
                      }
                      className="rounded-xl h-9 text-xs flex-2"
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
