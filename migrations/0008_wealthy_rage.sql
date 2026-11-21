CREATE TYPE "public"."usage_kind" AS ENUM('resume_analysis');--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" "usage_kind" NOT NULL,
	"resume_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_events_user_kind_idx" ON "usage_events" USING btree ("user_id","kind","created_at");--> statement-breakpoint
-- Backfill: every existing AI-parsed resume counts as one past analysis
INSERT INTO "usage_events" ("user_id", "kind", "resume_id", "created_at")
SELECT "user_id", 'resume_analysis', "id", "created_at" FROM "resumes" WHERE "status" = 'parsed';