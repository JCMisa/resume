import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton, KpiSkeletonRow, SkeletonPage } from "@/components/custom/PageSkeletons";

// Mirrors the Admin page layout so nothing jumps when data arrives.
export default function AdminLoading() {
  return (
    <SkeletonPage label="Loading admin">
      <HeaderSkeleton />

      <KpiSkeletonRow count={6} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4" />

      <div className="rounded-3xl border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <Skeleton className="h-7 w-28" />
          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-9 w-full sm:w-72 rounded-xl" />
            <Skeleton className="h-9 w-full sm:w-48 rounded-xl" />
          </div>
        </div>
        <div className="rounded-2xl border divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-3 sm:p-4 grid gap-3 grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="space-y-2 min-w-0 flex-1">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 md:gap-5 md:w-[340px]">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-8" />
                ))}
              </div>
              <Skeleton className="h-8 w-full md:w-32 rounded-xl md:justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
