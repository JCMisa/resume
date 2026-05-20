/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import SortablePreviewSection from "./SortablePreviewSection";

interface LivePreviewProps {
  data: {
    personalDetails: any;
    professionalSummary: string;
    skills: any[];
    experiences: any[];
    projects: any[];
    educations: any[];
    certificates: any[];
    sectionOrder: string[];
  };
  isFinalPreview: boolean;
  onOrderChange?: (newOrder: string[]) => void; // 🚀 Callback to propagate state modifications back up
}

export default function ResumeLivePreview({
  data,
  isFinalPreview,
  onOrderChange,
}: LivePreviewProps) {
  const {
    personalDetails,
    professionalSummary,
    skills,
    experiences,
    projects,
    educations,
    certificates,
    sectionOrder,
  } = data;

  // Track explicit sensor types to allow simultaneous pointer touch inputs and keyboard accessibility adjustments
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // Prevents accidental drag fires on general surface clicks
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEndInference = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onOrderChange) return;

    const oldIndex = sectionOrder.indexOf(active.id as string);
    const newIndex = sectionOrder.indexOf(over.id as string);

    const reorderedArray = arrayMove(sectionOrder, oldIndex, newIndex);
    onOrderChange(reorderedArray); // Updates parent component state instantly
  };

  // Render Strategy Section Router
  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        if (
          !personalDetails?.name &&
          !personalDetails?.email &&
          !personalDetails?.phone
        )
          return null;
        return (
          <div className="text-center space-y-2 pb-2">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 uppercase">
              {personalDetails.name || "YOUR FULL NAME"}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400 font-medium">
              {personalDetails.phone && <span>{personalDetails.phone}</span>}|
              {personalDetails.email && (
                <span className="underline">{personalDetails.email}</span>
              )}
              |
              {personalDetails.address && (
                <span>{personalDetails.address}</span>
              )}
            </div>
            {personalDetails.links?.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-x-2 text-[11px] text-primary font-bold">
                {personalDetails.links.map((lnk: any, i: number) => (
                  <React.Fragment key={i}>
                    <a
                      href={lnk.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {lnk.label || "Link"}
                    </a>
                    <span
                      className={cn(
                        "text-black dark:text-white",
                        i >= personalDetails.links.length - 1 && "hidden",
                      )}
                    >
                      ·
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        );

      case "summary":
        if (!professionalSummary) return null;
        return (
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-800 dark:text-stone-200">
              Professional Summary
            </h3>
            <p className="text-xs leading-relaxed wrap-break-word text-stone-600 dark:text-stone-400 text-justify">
              {professionalSummary}
            </p>
          </div>
        );

      case "skills":
        if (skills.length === 0) return null;
        const groupedSkills = skills.reduce((acc: any, curr: any) => {
          if (!curr.category || !curr.value) return acc;
          if (!acc[curr.category]) acc[curr.category] = [];
          acc[curr.category].push(curr.value);
          return acc;
        }, {});

        return (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-800 dark:text-stone-200">
              Technical Skills
            </h3>
            <div className="space-y-1">
              {Object.keys(groupedSkills).map((cat) => (
                <p
                  key={cat}
                  className="text-xs text-stone-600 dark:text-stone-400"
                >
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {cat}:
                  </span>{" "}
                  {groupedSkills[cat].join(", ")}
                </p>
              ))}
            </div>
          </div>
        );

      case "experience":
        if (experiences.length === 0) return null;
        return (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-800 dark:text-stone-200">
              Work Experience
            </h3>
            <div className="space-y-3">
              {experiences.map((exp: any) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-950 dark:text-stone-50">
                        {exp.role}
                      </span>
                      {exp.company && (
                        <span className="text-stone-500 dark:text-stone-400 font-medium">
                          {" "}
                          | {exp.company}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-stone-500 shrink-0">
                      {exp.duration}
                    </span>
                  </div>
                  <ul className="list-disc pl-4 text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                    {exp.bullets?.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case "projects":
        if (projects.length === 0) return null;
        return (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-800 dark:text-stone-200">
              Projects
            </h3>
            <div className="space-y-3">
              {projects.map((proj: any) => (
                <div key={proj.id} className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="font-bold text-stone-950 dark:text-stone-50">
                        {proj.title || "Untitled Project"}
                      </span>
                      {proj.links?.[0]?.url && (
                        <span className="text-stone-400 dark:text-stone-600 font-normal">
                          |{" "}
                          <a
                            href={proj.links[0].url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary font-bold underline text-[11px] inline-flex items-center gap-0.5 hover:text-primary/80 transition-colors"
                          >
                            {proj.links[0].label || "Link"}
                          </a>
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-stone-500 shrink-0">
                      {proj.duration}
                    </span>
                  </div>
                  <ul className="list-disc pl-4 text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                    {proj.description?.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case "education":
        if (educations.length === 0) return null;
        return (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-800 dark:text-stone-200">
              Education
            </h3>
            <div className="space-y-2">
              {educations.map((edu: any) => (
                <div
                  key={edu.id}
                  className="flex items-start justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-stone-950 dark:text-stone-50">
                      {edu.course}
                    </span>
                    {edu.major && (
                      <span className="text-stone-500 font-medium">
                        {" "}
                        ({edu.major})
                      </span>
                    )}
                    <p className="text-stone-600 dark:text-stone-400 italic text-[11px]">
                      {edu.schoolName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-[11px] text-stone-500">
                      {edu.duration}
                    </p>
                    {edu.gwa && (
                      <p className="text-[10px] font-mono font-bold text-primary">
                        GWA: {edu.gwa}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "certificates":
        if (certificates.length === 0) return null;
        return (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-800 dark:text-stone-200">
              Certifications
            </h3>
            <div className="space-y-1.5">
              {certificates.map((cert: any) => (
                <div
                  key={cert.id}
                  className="flex items-baseline justify-between text-xs"
                >
                  <p className="text-stone-600 dark:text-stone-400">
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {cert.title}
                    </span>
                    {cert.description && ` - ${cert.description}`}
                  </p>
                  <span className="font-mono text-[10px] text-stone-500 shrink-0">
                    {cert.issuedDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const previewShell = (
    <div className="w-full min-h-[800px] bg-white dark:bg-neutral-950 rounded-2xl border p-6 lg:p-8 print:shadow-none print:border-none flex flex-col space-y-4 font-sans text-stone-900 dark:text-stone-100 select-none">
      {/* 🚀 1. Filter out empty sections first to calculate the true visible last section index */}
      {sectionOrder
        .filter((sectionId) => renderSectionContent(sectionId) !== null)
        .map((sectionId, index, filteredArray) => {
          const content = renderSectionContent(sectionId);

          return (
            <SortablePreviewSection
              key={sectionId}
              id={sectionId}
              isFinalPreview={isFinalPreview}
            >
              <div className="w-full">
                {content}

                {/* 🚀 2. Apply a separator after every section EXCEPT the very last visible one */}
                {index < filteredArray.length - 1 && (
                  <div className="h-[1px] bg-stone-200 dark:bg-stone-800 w-full my-3 pointer-events-none" />
                )}
              </div>
            </SortablePreviewSection>
          );
        })}
    </div>
  );

  // If we are in the clean static view mode, bypass dnd wrappers entirely to maximize speed performance profiles
  if (isFinalPreview) {
    return previewShell;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]} // Restricts drift, keeping sections locked on the vertical Y axis
      onDragEnd={handleDragEndInference}
    >
      <SortableContext
        items={sectionOrder}
        strategy={verticalListSortingStrategy}
      >
        {previewShell}
      </SortableContext>
    </DndContext>
  );
}
