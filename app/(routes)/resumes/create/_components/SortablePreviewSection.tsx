"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortablePreviewSectionProps {
  id: string;
  isFinalPreview: boolean;
  children: React.ReactNode;
}

export default function SortablePreviewSection({
  id,
  isFinalPreview,
  children,
}: SortablePreviewSectionProps) {
  // Hook up tracking node configurations for the dnd matrix pointer positioning
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id, disabled: isFinalPreview });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative w-full transition-all duration-300",
        isDragging &&
          "opacity-40 scale-[0.98] border border-dashed border-primary/40 rounded-xl bg-primary/5 z-40 shadow-md",
        !isFinalPreview &&
          !isDragging &&
          "hover:bg-muted/10 rounded-lg p-1 -m-1",
      )}
    >
      {/* DRAG AND DROP DOTTED INTERACTION HANDLE INDICATOR */}
      {!isFinalPreview && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-grab active:cursor-grabbing bg-muted border rounded p-1 shadow-sm text-muted-foreground z-50 touch-none"
          title="Drag to reorder section order position"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}

      {children}
    </div>
  );
}
