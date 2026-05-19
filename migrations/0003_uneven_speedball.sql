CREATE TYPE "public"."resume_status" AS ENUM('parsed', 'created');--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "status" "resume_status" DEFAULT 'created' NOT NULL;