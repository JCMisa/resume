import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage } from "@/components/custom/PageSkeletons";

// Mirrors the share screen: header, then preview + download/share cards.
export default function ShareLoading() {
  return (
    <SkeletonPage label="Loading sharing options">
      <div className="flex items-center gap-3 border-b pb-5">
        <Skeleton className="size-9 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72 max-w-[60vw]" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Skeleton className="hidden lg:block aspect-[210/297] w-full max-w-xl mx-auto rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    </SkeletonPage>
  );
}
