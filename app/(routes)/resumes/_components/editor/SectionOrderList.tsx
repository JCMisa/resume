"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_TITLES } from "@/lib/resume-templates";

function Row({
  id,
  filled,
  index,
  count,
  onMove,
}: {
  id: string;
  filled: boolean;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, transition }}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-card px-2 py-2",
        isDragging && "relative z-10 shadow-lg ring-2 ring-primary/40",
      )}
    >
      <button
        type="button"
        className="size-8 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        aria-label={`Drag ${SECTION_TITLES[id]}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="flex-1 text-sm font-semibold">{SECTION_TITLES[id]}</span>
      {!filled && <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Empty · hidden</span>}
      {/* Buttons as a non-drag alternative (keyboard / small screens) */}
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label={`Move ${SECTION_TITLES[id]} up`}
        className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30"
      >
        <ArrowUp className="size-3.5" />
      </button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label={`Move ${SECTION_TITLES[id]} down`}
        className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30"
      >
        <ArrowDown className="size-3.5" />
      </button>
    </li>
  );
}

/** Reorder resume sections (the header always stays on top). */
export default function SectionOrderList({
  order,
  filled,
  onChange,
}: {
  order: string[];
  filled: (key: string) => boolean;
  onChange: (order: string[]) => void;
}) {
  const movable = order.filter((k) => k !== "personal");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const move = (from: number, to: number) => onChange(["personal", ...arrayMove(movable, from, to)]);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(movable.indexOf(String(active.id)), movable.indexOf(String(over.id)));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Drag sections (or use the arrows) to change their order. Your name and contact details always stay at the top;
        empty sections are left out of the resume.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={movable} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {movable.map((id, i) => (
              <Row key={id} id={id} index={i} count={movable.length} filled={filled(id)} onMove={move} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
