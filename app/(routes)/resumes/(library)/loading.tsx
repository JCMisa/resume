import { Skeleton } from "@/components/ui/skeleton";
import {
  CardSkeleton,
  HeaderSkeleton,
  KpiSkeletonRow,
  SkeletonPage,
} from "@/components/custom/PageSkeletons";

// Mirrors the Resumes dashboard layout so nothing jumps when data arrives.
export default function ResumesLoading() {
  return (
    <SkeletonPage label="Loading resumes">
      <HeaderSkeleton actions={2} />

      <KpiSkeletonRow
        count={6}
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CardSkeleton className="lg:col-span-2" />
        <CardSkeleton lines={6} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton lines={8} className="md:col-span-2 xl:col-span-1" />
      </div>

      <div className="rounded-3xl border bg-card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <Skeleton className="h-8 w-40" />
          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-9 w-full sm:w-64 rounded-xl" />
            <Skeleton className="h-9 w-full sm:w-36 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
