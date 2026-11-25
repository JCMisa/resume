import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPage } from "@/components/custom/PageSkeletons";

export default function SettingsLoading() {
  return (
    <SkeletonPage label="Loading settings" className="space-y-0">
      {/* Top bar */}
      <div className="border-b h-14 px-5 sm:px-8 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="px-5 sm:px-8 pt-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
          {/* Left: title, tabs, usage cards */}
          <aside className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-52 max-w-full" />
            </div>
            <div className="flex lg:flex-col gap-2 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-28 lg:w-full shrink-0 rounded-xl" />
              ))}
            </div>
            <div className="hidden lg:block space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </aside>

          {/* Right: active tab content */}
          <div className="rounded-2xl border bg-card p-6 space-y-6 min-w-0">
            <div className="flex items-start gap-4 pb-6 border-b">
              <Skeleton className="size-10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="size-20 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-3 w-48 max-w-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
