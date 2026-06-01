"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SidebarFallbackProps {
  isCollapsed?: boolean;
}

export function SidebarFallback({ isCollapsed = false }: SidebarFallbackProps) {
  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-stone-800 bg-stone-950 text-white transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-center mt-4 mb-3",
          !isCollapsed && "justify-start ml-4",
        )}
      >
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded bg-stone-900" />
            <Skeleton className="h-6 w-6 rounded-full bg-stone-900" />
          </div>
        ) : (
          <Skeleton className="h-6 w-6 rounded-full bg-stone-900" />
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-stone-800" />

      {/* Menu Items */}
      <div className="flex flex-col mt-4 space-y-2 px-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 rounded-md transition-all duration-300",
              isCollapsed ? "justify-center py-3" : "px-3 py-3",
            )}
          >
            <Skeleton className="h-5 w-5 rounded bg-stone-900" />
            {!isCollapsed && (
              <Skeleton className="h-5 w-24 rounded bg-stone-900" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom Profile Circle */}
      <div className="mt-auto mb-4 flex justify-center">
        <Skeleton className="h-8 w-8 rounded-full bg-stone-900" />
      </div>
    </aside>
  );
}
