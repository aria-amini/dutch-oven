ALTER TABLE "collections" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "collections" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "recipes" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "recipes" RENAME COLUMN "collectionId" TO "collection_id";--> statement-breakpoint
ALTER TABLE "recipes" RENAME COLUMN "imageUrl" TO "image_url";--> statement-breakpoint
ALTER TABLE "recipes" RENAME COLUMN "createdAt" TO "created_at";