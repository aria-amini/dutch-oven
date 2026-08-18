CREATE TABLE "meal_logs" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"recipeId" text NOT NULL,
	"cookedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" text PRIMARY KEY,
	"recipeId" text NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_steps" (
	"id" text PRIMARY KEY,
	"recipeId" text NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "items";--> statement-breakpoint
CREATE INDEX "meal_logs_user_id_index" ON "meal_logs" ("userId");--> statement-breakpoint
CREATE INDEX "meal_logs_recipe_id_index" ON "meal_logs" ("recipeId");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_recipe_id_index" ON "recipe_ingredients" ("recipeId");--> statement-breakpoint
CREATE INDEX "recipe_steps_recipe_id_index" ON "recipe_steps" ("recipeId");--> statement-breakpoint
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_recipe_id_fk" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fk" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_fk" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE;