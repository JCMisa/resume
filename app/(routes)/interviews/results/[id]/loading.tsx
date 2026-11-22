import { Skeleton } from "@/components/ui/skeleton";
import {
  CardSkeleton,
  HeaderSkeleton,
  SkeletonPage,
} from "@/components/custom/PageSkeletons";

export default function InterviewResultLoading() {
  return (
    <SkeletonPage
      label="Loading interview report"
      className="p-6 lg:p-12 max-w-5xl mx-auto space-y-8"
    >
      <HeaderSkeleton actions={1} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Score + category breakdown */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border bg-card p-6 flex flex-col items-center gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="size-28 rounded-full" />
            <Skeleton className="h-3 w-48 max-w-full" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
          <CardSkeleton lines={6} />
        </div>
        {/* Feedback, strengths/weaknesses, transcript */}
        <div className="lg:col-span-8 space-y-6">
          <CardSkeleton lines={5} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CardSkeleton lines={4} />
            <CardSkeleton lines={4} />
          </div>
          <CardSkeleton bodyHeight="h-[260px]" />
        </div>
      </div>
    </SkeletonPage>
  );
}
