-- Add 'resume_create' to usage_kind. Recreate the type instead of
-- ALTER TYPE ... ADD VALUE, because a value added that way can't be used in
-- the same transaction, and the backfill below needs it.
ALTER TYPE "public"."usage_kind" RENAME TO "usage_kind_old";--> statement-breakpoint
CREATE TYPE "public"."usage_kind" AS ENUM('resume_analysis', 'resume_create');--> statement-breakpoint
ALTER TABLE "usage_events" ALTER COLUMN "kind" TYPE "public"."usage_kind" USING "kind"::text::"public"."usage_kind";--> statement-breakpoint
DROP TYPE "public"."usage_kind_old";--> statement-breakpoint
-- Backfill: every existing editor-built resume counts as one past build
INSERT INTO "usage_events" ("user_id", "kind", "resume_id", "created_at")
SELECT "user_id", 'resume_create', "id", "created_at" FROM "resumes" WHERE "status" = 'created';
