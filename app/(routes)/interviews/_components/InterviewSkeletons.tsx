import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/custom/PageSkeletons";

// Shared by app/(routes)/interviews/loading.tsx (route loading) and the page's
// own "checking access" state, so the handoff between them doesn't jump.

/** Mirrors InterviewSetupForm: role + job description | resume dropzone, then Start. */
export function SetupFormSkeleton() {
  return (
    <div className="w-full bg-card border p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-40 lg:h-48 w-full rounded-xl" />
          </div>
        </div>
        <div className="space-y-2 flex flex-col">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="flex-1 min-h-48 w-full rounded-2xl" />
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}

/** Mirrors InterviewProgressCard: 3 stat tiles + score bars. */
export function ProgressCardSkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {[40, 65, 50, 80, 60, 75, 90].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Mirrors InterviewPrepCard: checklist + mic check. */
export function PrepCardSkeleton() {
  return <CardSkeleton lines={5} />;
}
