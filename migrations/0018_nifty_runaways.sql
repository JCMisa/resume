ALTER TYPE "public"."usage_kind" ADD VALUE 'resume_tailor';--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "tailored_for" jsonb;