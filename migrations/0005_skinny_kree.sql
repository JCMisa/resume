CREATE TYPE "public"."plan_tier" AS ENUM('free', 'pro');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_tier" "plan_tier" DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerk_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerk_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "analyses_count_this_month" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interviews_count_total" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "resume_create_attempts_count" integer DEFAULT 0;