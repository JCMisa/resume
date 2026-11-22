import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Building blocks for route-level loading.tsx files. Each page's skeleton
// mirrors its real layout (same grid + breakpoints) so nothing jumps on load.

/** Root wrapper: announces loading to assistive tech. */
export function SkeletonPage({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn("w-full space-y-6", className)}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      {children}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/** Icon tile + title + subtitle, with optional action buttons on the right. */
export function HeaderSkeleton({
  actions = 0,
  bordered = true,
}: {
  actions?: number;
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        bordered && "border-b pb-5",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton className="size-12 rounded-2xl shrink-0" />
        <div className="space-y-2 min-w-0">
          <Skeleton className="h-6 w-44 max-w-[50vw]" />
          <Skeleton className="h-4 w-80 max-w-[65vw]" />
        </div>
      </div>
      {actions > 0 && (
        <div className="flex gap-2 shrink-0">
          {Array.from({ length: actions }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  );
}

/** Card with an icon + title row and a body block. */
export function CardSkeleton({
  className,
  bodyHeight = "h-[200px]",
  lines,
}: {
  className?: string;
  bodyHeight?: string;
  /** Render text lines instead of a solid body block */
  lines?: number;
}) {
  return (
    <div className={cn("rounded-3xl border bg-card p-5 space-y-4 min-w-0", className)}>
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-xl shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44 max-w-full" />
        </div>
      </div>
      {lines ? (
        <div className="space-y-2.5">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className={cn("h-3", i % 3 === 2 ? "w-2/3" : "w-full")} />
          ))}
        </div>
      ) : (
        <Skeleton className={cn("w-full rounded-2xl", bodyHeight)} />
      )}
    </div>
  );
}

/** Row of KPI tiles. Pass the same responsive grid classes as the real page. */
export function KpiSkeletonRow({ count, className }: { count: number; className: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border bg-card p-4 flex items-start gap-3 min-w-0">
          <Skeleton className="size-10 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-20 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Card holding a list of rows (history lists, recent items). */
export function ListCardSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("rounded-3xl border bg-card overflow-hidden min-w-0", className)}>
      <div className="flex items-center gap-2.5 px-5 py-4 border-b">
        <Skeleton className="size-8 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-10 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Large dashed drop area / form block. */
export function BlockSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("w-full rounded-3xl", className)} />;
}
