import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage } from "@/components/custom/PageSkeletons";

// Mirrors the result page: header, then score/changes + the PDF viewer.
export default function TailoredLoading() {
  return (
    <SkeletonPage label="Loading your tailored resume">
      <div className="flex items-center gap-3 border-b pb-5">
        <Skeleton className="size-9 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-80 max-w-[60vw]" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
        <Skeleton className="h-[600px] rounded-3xl" />
      </div>
    </SkeletonPage>
  );
}
