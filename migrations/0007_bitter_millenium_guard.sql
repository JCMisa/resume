ALTER TABLE "users" DROP COLUMN "plan_tier";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clerk_subscription_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clerk_customer_id";--> statement-breakpoint
DROP TYPE "public"."plan_tier";