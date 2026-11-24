import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton, SkeletonPage } from "@/components/custom/PageSkeletons";

// Mirrors the start screen: header + steps, template cards, starting point.
export default function CreateResumeLoading() {
  return (
    <SkeletonPage label="Loading templates" className="space-y-8">
      <div className="space-y-5 border-b pb-6">
        <HeaderSkeleton bordered={false} />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-40 rounded-full" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-3 space-y-3">
              <Skeleton className="aspect-[210/297] w-full rounded-lg" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-56" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    </SkeletonPage>
  );
}
