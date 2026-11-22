"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { getProPlanIdAction } from "@/lib/actions/billing";
import { PRO_PLAN_KEY } from "@/lib/plans";

const BILLING_PATH = "/settings?tab=billing";

/**
 * One "go Pro" button for the whole app:
 * - signed out  -> sign up, then land on the billing page
 * - free user   -> opens Clerk's checkout drawer for Pro (monthly) in place
 * - already Pro -> "manage" link to the billing page
 * Falls back to the billing page (pricing table) if checkout can't load.
 *
 * Clerk's CheckoutButton is experimental (Billing public beta). If its API
 * changes, only this file needs updating.
 */
export default function ProCheckoutButton({
  children,
  className,
  proLabel = "Manage subscription",
}: {
  children: React.ReactNode;
  className?: string;
  /** Label shown to users who already have Pro */
  proLabel?: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoaded, isSignedIn, has } = useAuth();
  const isPro = isLoaded && isSignedIn && has({ plan: PRO_PLAN_KEY });
  const [planId, setPlanId] = useState<string | null>(null);

  // Only free, signed-in users need the plan id
  const needsPlanId = isLoaded && isSignedIn && !isPro;
  useEffect(() => {
    if (!needsPlanId) return;
    let cancelled = false;
    getProPlanIdAction().then((res) => {
      if (!cancelled && res.success) setPlanId(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [needsPlanId]);

  if (!isLoaded || !isSignedIn) {
    return (
      <Link
        href={`/sign-up?redirect_url=${encodeURIComponent(BILLING_PATH)}`}
        className={className}
      >
        {children}
      </Link>
    );
  }

  if (isPro) {
    return (
      <Link href={BILLING_PATH} className={className}>
        {proLabel}
      </Link>
    );
  }

  if (!planId) {
    // Still loading, or lookup failed: the billing page has the pricing table
    return (
      <Link href={BILLING_PATH} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <CheckoutButton
      planId={planId}
      planPeriod="month"
      newSubscriptionRedirectUrl="/dashboard"
      onSubscriptionComplete={() => router.refresh()}
    >
      <button type="button" className={className}>
        {children}
      </button>
    </CheckoutButton>
  );
}
