ALTER TABLE "resumes" ALTER COLUMN "template_id" DROP DEFAULT;--> statement-breakpoint
-- Nothing ever chose a template before the editor existed: these are the old
-- column default, not user picks. Clear them so old resumes use the default (Classic).
UPDATE "resumes" SET "template_id" = NULL WHERE "template_id" = 'modern';
