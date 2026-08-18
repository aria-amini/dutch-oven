ALTER TABLE "meal_logs" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "meal_logs" RENAME COLUMN "recipeId" TO "recipe_id";--> statement-breakpoint
ALTER TABLE "meal_logs" RENAME COLUMN "cookedAt" TO "cooked_at";--> statement-breakpoint
ALTER TABLE "recipe_ingredients" RENAME COLUMN "recipeId" TO "recipe_id";--> statement-breakpoint
ALTER TABLE "recipe_steps" RENAME COLUMN "recipeId" TO "recipe_id";--> statement-breakpoint
DROP INDEX "meal_logs_user_id_index";--> statement-breakpoint
CREATE INDEX "meal_logs_user_id_index" ON "meal_logs" ("user_id","cooked_at");