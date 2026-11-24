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
import { Plus, Trash2, Award } from "lucide-react";

interface CertificatesFormProps {
  data: any[];
  onChange: (val: any[]) => void;
}

export default function CertificatesForm({
  data,
  onChange,
}: CertificatesFormProps) {
  const handleCertChange = (index: number, key: string, value: string) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  const addCertificate = () => {
    onChange([
      ...data,
      {
        id: globalThis.crypto.randomUUID(),
        title: "",
        issuedDate: "",
        description: "",
      },
    ]);
  };

  const removeCertificate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(data.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Professional Credentials & Licenses
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCertificate}
          className="rounded-lg text-[11px] font-bold h-7 gap-1"
        >
          <Plus className="h-3 w-3" /> Add Certificate
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-xs text-muted-foreground bg-muted/10">
          No credentials recorded. Click above to include your first
          certification.
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-3 border-none"
        >
          {data.map((cert, index) => (
            <AccordionItem
              key={cert.id}
              value={cert.id}
              className="border rounded-2xl bg-card px-4 py-1 shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4 text-left">
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                      <Award className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold truncate">
                      {cert.title || "Untitled Credential"}
                    </span>
                  </div>
                  <div
                    onClick={(e) => removeCertificate(cert.id, e)}
                    className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0 h-8 w-8 ml-2 flex items-center justify-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4 border-t border-dashed border-border/60 overflow-y-auto !no-scrollbar">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      Certification Title
                    </span>
                    <Input
                      placeholder="Building with the Claude API"
                      value={cert.title || ""}
                      onChange={(e) =>
                        handleCertChange(index, "title", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">
                      Issue Date
                    </span>
                    <Input
                      placeholder="March 2026"
                      value={cert.issuedDate || ""}
                      onChange={(e) =>
                        handleCertChange(index, "issuedDate", e.target.value)
                      }
                      className="rounded-xl h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    Authority / Short Details
                  </span>
                  <Input
                    placeholder="Issued by Anthropic Learning Network"
                    value={cert.description || ""}
                    onChange={(e) =>
                      handleCertChange(index, "description", e.target.value)
                    }
                    className="rounded-xl h-9"
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
