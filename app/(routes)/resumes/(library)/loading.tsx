import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the Resumes dashboard layout so nothing jumps when data arrives.
export default function ResumesLoading() {
  return (
    <div className="w-full space-y-6" aria-busy="true" aria-label="Loading resumes">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-72 max-w-[60vw]" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-3xl border bg-card p-4 flex items-start gap-3">
            <Skeleton className="size-10 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartSkeleton className="lg:col-span-2" />
        <ChartSkeleton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton className="md:col-span-2 xl:col-span-1" />
      </div>

      <div className="rounded-3xl border bg-card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-64 max-w-full rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-3xl border bg-card p-5 space-y-4 ${className ?? ""}`}>
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <Skeleton className="h-[200px] w-full rounded-2xl" />
    </div>
  );
}
