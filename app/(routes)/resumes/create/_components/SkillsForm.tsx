/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface SkillsFormProps {
  data: any[];
  onChange: (val: any[]) => void;
}

export default function SkillsForm({ data, onChange }: SkillsFormProps) {
  const handleSkillChange = (index: number, key: string, value: string) => {
    const updatedSkills = [...data];
    updatedSkills[index] = { ...updatedSkills[index], [key]: value };
    onChange(updatedSkills);
  };

  const addSkillField = () => {
    onChange([
      ...data,
      { id: globalThis.crypto.randomUUID(), category: "", value: "" },
    ]);
  };

  const removeSkillField = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Technical Skills
          </label>
          <p className="text-[11px] text-muted-foreground">
            Add specific categories and separate elements
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSkillField}
          className="rounded-lg text-[11px] font-bold h-7 gap-1"
        >
          <Plus className="h-3 w-3" /> Add Skill Entry
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-xs text-muted-foreground bg-muted/10">
          No technical skills added yet. Click above to include your first tech
          stack node.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((skill, index) => (
            <div
              key={skill.id}
              className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200"
            >
              <Input
                placeholder="Category (e.g., Frontend)"
                value={skill.category || ""}
                onChange={(e) =>
                  handleSkillChange(index, "category", e.target.value)
                }
                className="rounded-xl flex-1"
              />
              <Input
                placeholder="Skill name (e.g., React, Next.js)"
                value={skill.value || ""}
                onChange={(e) =>
                  handleSkillChange(index, "value", e.target.value)
                }
                className="rounded-xl flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSkillField(skill.id)}
                className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
