CREATE TABLE "collections" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" text PRIMARY KEY,
	"userId" text NOT NULL,
	"collectionId" text,
	"title" text NOT NULL,
	"imageUrl" text,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "collections_user_id_index" ON "collections" ("userId");--> statement-breakpoint
CREATE INDEX "recipes_user_id_index" ON "recipes" ("userId");--> statement-breakpoint
CREATE INDEX "recipes_collection_id_index" ON "recipes" ("collectionId");--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_collection_id_fk" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL;