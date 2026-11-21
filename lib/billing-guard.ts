import "server-only";

import { getUserBillingStatus } from "@/lib/actions/billing";
import { RateLimitError } from "@/lib/arcjet";
import {
  LIMIT_REACHED,
  limitReachedMessage,
  type GatedFeature,
} from "@/lib/plans";

/** Thrown by server actions when the user's plan doesn't allow the request. */
export class PlanLimitError extends Error {
  readonly code = LIMIT_REACHED;
  constructor(feature: GatedFeature) {
    super(limitReachedMessage(feature));
    this.name = "PlanLimitError";
  }
}

/**
 * Server-side plan enforcement. Call before doing any metered work
 * (and before Arcjet, so blocked requests don't burn rate-limit tokens).
 */
export async function assertAllowed(feature: GatedFeature) {
  const billing = await getUserBillingStatus();
  if (!billing.allowed[feature]) throw new PlanLimitError(feature);
  return billing;
}

/** Shapes a caught error into the standard action failure result. */
export function toActionError(error: unknown, fallback: string) {
  if (error instanceof PlanLimitError || error instanceof RateLimitError) {
    return { success: false as const, error: error.message, code: error.code };
  }
  return {
    success: false as const,
    error: error instanceof Error ? error.message : fallback,
  };
}
