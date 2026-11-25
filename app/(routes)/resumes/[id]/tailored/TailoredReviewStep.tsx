"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UpgradeModal from "@/components/custom/UpgradeModal";
import TailorReview, { type TailorReviewData } from "../../create/_components/tailor/TailorReview";

/** An unfinished tailored resume: the same review step as in the wizard. */
export default function TailoredReviewStep({ data, isPro }: { data: TailorReviewData; isPro: boolean }) {
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  return (
    <div className="w-full space-y-6 pb-24 sm:pb-8">
      <header className="border-b pb-5">
        <h1 className="text-2xl font-black tracking-tight">Finish your tailored resume</h1>
        <p className="text-sm text-muted-foreground mt-0.5">One last step: tick the skills you really have and pick a look.</p>
      </header>
      <TailorReview data={data} isPro={isPro} onLocked={() => setLocked(true)} onDone={() => router.refresh()} />
      <UpgradeModal
        isOpen={locked}
        onClose={() => setLocked(false)}
        title="Designer templates are a Pro feature"
        description="Upgrade to Pro for designer templates plus your own colours and fonts. Classic, Modern and Compact stay free."
      />
    </div>
  );
}
