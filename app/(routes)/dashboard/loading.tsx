import { Skeleton } from "@/components/ui/skeleton";
import {
  CardSkeleton,
  KpiSkeletonRow,
  ListCardSkeleton,
  SkeletonPage,
} from "@/components/custom/PageSkeletons";

export default function DashboardLoading() {
  return (
    <SkeletonPage
      label="Loading dashboard"
      className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[1400px] mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-[70vw]" />
          <Skeleton className="h-3.5 w-80 max-w-[80vw]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      <KpiSkeletonRow count={4} className="grid grid-cols-2 md:grid-cols-4 gap-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton bodyHeight="h-[290px]" />
        <CardSkeleton className="lg:col-span-2" bodyHeight="h-[290px]" />
        <ListCardSkeleton rows={5} className="lg:col-span-2" />
        <CardSkeleton bodyHeight="h-[260px]" />
      </div>
    </SkeletonPage>
  );
}
