ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_anonymous" boolean DEFAULT false NOT NULL;
