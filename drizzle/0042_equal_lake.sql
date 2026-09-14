CREATE TYPE "public"."DownloadCategory" AS ENUM('SCHEDULE', 'RULES', 'FORMS', 'BROCHURE', 'RESULTS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."DownloadFileType" AS ENUM('PDF', 'DOC', 'XLS', 'JPG', 'PNG', 'ZIP', 'OTHER');--> statement-breakpoint
CREATE TABLE "festival_download" (
	"id" text PRIMARY KEY NOT NULL,
	"festivalId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"fileUrl" text NOT NULL,
	"fileType" "DownloadFileType" NOT NULL,
	"category" "DownloadCategory" NOT NULL,
	"publishedAt" timestamp(3) with time zone,
	"createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by_name" text,
	"created_by_email" text
);
--> statement-breakpoint
ALTER TABLE "food_hall_entry" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "food_hall_session" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "food_hall_slot" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "food_hall_entry" CASCADE;--> statement-breakpoint
DROP TABLE "food_hall_session" CASCADE;--> statement-breakpoint
DROP TABLE "food_hall_slot" CASCADE;--> statement-breakpoint
ALTER TABLE "checkpoint_session" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "institution" ADD COLUMN "customDomainConnected" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "programme_assignment" ADD COLUMN "has_participated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stage_portal_credential" ADD COLUMN "pin_plaintext" text;--> statement-breakpoint
ALTER TABLE "festival_download" ADD CONSTRAINT "festival_download_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "public"."festival"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "festival_download_festival_idx" ON "festival_download" USING btree ("festivalId");--> statement-breakpoint
ALTER TABLE "checkpoint_session" ADD CONSTRAINT "checkpoint_session_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "festival_news_festivalId_slug_key" ON "festival_news" USING btree ("festivalId","slug");