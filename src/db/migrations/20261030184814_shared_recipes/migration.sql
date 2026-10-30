-- Recipes become shared: who saved what, and in which book, moves to
-- shelf_recipes. Every existing recipe stays private to its owner, lands on
-- their shelf in its book, and counts as finished; only new web imports share.
CREATE TABLE "shelf_recipes" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"recipe_id" text NOT NULL,
	"collection_id" text,
	"notes" text,
	"added_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
INSERT INTO "shelf_recipes" ("id", "user_id", "recipe_id", "collection_id", "added_at")
SELECT gen_random_uuid()::text, "user_id", "id", "collection_id", "created_at" FROM "recipes";--> statement-breakpoint
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_collection_id_fk";--> statement-breakpoint
DROP INDEX "recipes_collection_id_index";--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "forked_from_id" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "servings" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "total_minutes" integer;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "finalized_at" timestamp with time zone;--> statement-breakpoint
UPDATE "recipes" SET "finalized_at" = "created_at";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "collection_id";--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_shared_source_url_index" ON "recipes" ("source_url") WHERE ("user_id" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "shelf_recipes_user_recipe_index" ON "shelf_recipes" ("user_id","recipe_id");--> statement-breakpoint
CREATE INDEX "shelf_recipes_recipe_id_index" ON "shelf_recipes" ("recipe_id");--> statement-breakpoint
CREATE INDEX "shelf_recipes_collection_id_index" ON "shelf_recipes" ("collection_id");--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_forked_from_id_fk" FOREIGN KEY ("forked_from_id") REFERENCES "recipes"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "shelf_recipes" ADD CONSTRAINT "shelf_recipes_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shelf_recipes" ADD CONSTRAINT "shelf_recipes_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shelf_recipes" ADD CONSTRAINT "shelf_recipes_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE SET NULL;