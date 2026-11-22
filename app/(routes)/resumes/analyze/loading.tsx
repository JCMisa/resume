import { Skeleton } from "@/components/ui/skeleton";
import {
  BlockSkeleton,
  CardSkeleton,
  ListCardSkeleton,
  SkeletonPage,
} from "@/components/custom/PageSkeletons";

export default function AnalyzeLoading() {
  return (
    <SkeletonPage label="Loading resume analyzer">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 max-w-[50vw]" />
            <Skeleton className="h-4 w-80 max-w-[65vw]" />
          </div>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-[2px] w-10" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] items-start">
        <div className="min-w-0 space-y-6">
          <BlockSkeleton className="h-[320px]" />
          <CardSkeleton lines={4} />
        </div>
        <aside className="space-y-6 min-w-0">
          <CardSkeleton bodyHeight="h-[72px]" />
          <ListCardSkeleton rows={4} />
        </aside>
      </div>
    </SkeletonPage>
  );
}
