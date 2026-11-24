/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface PersonalFormProps {
  data: any;
  onChange: (val: any) => void;
}

export default function PersonalForm({ data, onChange }: PersonalFormProps) {
  const handleChange = (key: string, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const handleLinkChange = (index: number, key: string, value: string) => {
    const updatedLinks = [...(data.links || [])];
    updatedLinks[index] = { ...updatedLinks[index], [key]: value };
    onChange({ ...data, links: updatedLinks });
  };

  const addLinkField = () => {
    onChange({
      ...data,
      links: [...(data.links || []), { label: "", url: "" }],
    });
  };

  const removeLinkField = (index: number) => {
    onChange({
      ...data,
      links: data.links.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Full Name
        </label>
        <Input
          placeholder="John Doe"
          value={data.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          className="rounded-xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Phone Number
          </label>
          <Input
            placeholder="+63 900 000 0000"
            value={data.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Email Address
          </label>
          <Input
            placeholder="johndoe@gmail.com"
            type="email"
            value={data.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Address (Optional)
        </label>
        <Input
          placeholder="City, Philippines"
          value={data.address || ""}
          onChange={(e) => handleChange("address", e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* REPEATABLE LINKS ROW */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-primary/80">
            Profile Links
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLinkField}
            className="rounded-lg text-[11px] font-bold h-7 gap-1"
          >
            <Plus className="h-3 w-3" /> Add Profile Link
          </Button>
        </div>

        {(data.links || []).map((lnk: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200"
          >
            <Input
              placeholder="Label (e.g., GitHub)"
              value={lnk.label || ""}
              onChange={(e) => handleLinkChange(index, "label", e.target.value)}
              className="rounded-xl flex-1"
            />
            <Input
              placeholder="URL (https://...)"
              value={lnk.url || ""}
              onChange={(e) => handleLinkChange(index, "url", e.target.value)}
              className="rounded-xl flex-2"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeLinkField(index)}
              className="text-destructive hover:bg-destructive/10 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
