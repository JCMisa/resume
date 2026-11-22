import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage } from "@/components/custom/PageSkeletons";

function FormPanelSkeleton() {
  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-xl" />
        ))}
      </div>
      <div className="rounded-3xl border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-6 sm:p-8 space-y-6 aspect-[1/1.3]">
      <div className="space-y-2 flex flex-col items-center">
        <Skeleton className="h-7 w-56 max-w-full" />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export default function CreateResumeLoading() {
  return (
    <SkeletonPage label="Loading resume builder" className="space-y-0">
      {/* Top bar: title input + actions */}
      <div className="border-b h-16 px-6 flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48 max-w-[45vw] rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl hidden sm:block" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="w-full p-4 lg:p-8">
        {/* Mobile: Editor / Preview tabs */}
        <div className="lg:hidden space-y-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <FormPanelSkeleton />
        </div>
        {/* Desktop: form + live preview */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <FormPanelSkeleton />
          </div>
          <div className="lg:col-span-7">
            <PreviewSkeleton />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
