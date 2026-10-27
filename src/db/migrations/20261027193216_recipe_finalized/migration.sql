-- Imported recipes start as drafts until they are finalized; every recipe that
-- already exists counts as finalized.
ALTER TABLE "recipes" ADD COLUMN "finalized_at" timestamp with time zone;--> statement-breakpoint
UPDATE "recipes" SET "finalized_at" = "created_at";
