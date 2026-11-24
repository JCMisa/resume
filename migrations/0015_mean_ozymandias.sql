ALTER TABLE "resumes" ADD COLUMN "share_code" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "share_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "share_hide_contact" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "share_views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_share_code_unique" UNIQUE("share_code");