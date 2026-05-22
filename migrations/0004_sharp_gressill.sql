ALTER TABLE "interviews" DROP CONSTRAINT "interviews_vapi_call_id_unique";--> statement-breakpoint
ALTER TABLE "interviews" DROP CONSTRAINT "interviews_resume_id_resumes_id_fk";
--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "job_role" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "job_description" text;--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN "resume_text" text NOT NULL;--> statement-breakpoint
ALTER TABLE "interviews" DROP COLUMN "resume_id";--> statement-breakpoint
ALTER TABLE "interviews" DROP COLUMN "vapi_call_id";--> statement-breakpoint
ALTER TABLE "interviews" DROP COLUMN "recording_url";--> statement-breakpoint
ALTER TABLE "interviews" DROP COLUMN "duration_seconds";