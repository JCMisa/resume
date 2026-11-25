import {
  HeaderSkeleton,
  ListCardSkeleton,
  SkeletonPage,
} from "@/components/custom/PageSkeletons";
import {
  PrepCardSkeleton,
  ProgressCardSkeleton,
  SetupFormSkeleton,
} from "./_components/InterviewSkeletons";

// Results pages have their own loading.tsx, so this only covers /interviews.
// The page reuses the same pieces while it checks plan access, so the
// handoff from this skeleton to the page doesn't jump.
export default function InterviewsLoading() {
  return (
    <SkeletonPage label="Loading interviews">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_440px] items-start">
        <div className="min-w-0 space-y-6">
          <SetupFormSkeleton />
          <ProgressCardSkeleton />
        </div>
        <aside className="space-y-6 min-w-0">
          <PrepCardSkeleton />
          <ListCardSkeleton rows={4} />
        </aside>
      </div>
    </SkeletonPage>
  );
}
