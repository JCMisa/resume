import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage } from "@/components/custom/PageSkeletons";

// Mirrors the editor: top bar, then form + page preview side by side (stacked on phones).
export default function EditResumeLoading() {
  return (
    <SkeletonPage label="Loading editor" className="flex flex-col gap-4 space-y-0">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-xl shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-6 w-56 max-w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-full rounded-lg lg:hidden" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(360px,460px)_minmax(0,1fr)]">
        <div className="rounded-3xl border bg-card p-4 space-y-4">
          <div className="flex gap-1.5 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 shrink-0 rounded-lg" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
        <div className="hidden lg:block rounded-3xl border bg-muted/40 p-6">
          <Skeleton className="mx-auto aspect-[210/297] max-w-[820px] rounded-sm" />
        </div>
      </div>
    </SkeletonPage>
  );
}
