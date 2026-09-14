-- Add slug column to festival_news
ALTER TABLE "festival_news" ADD COLUMN IF NOT EXISTS "slug" text;

-- Backfill existing rows: use the record id as a fallback slug
UPDATE "festival_news" SET "slug" = "id" WHERE "slug" IS NULL;

-- Add a unique index so (festivalId, slug) combinations are unique
CREATE UNIQUE INDEX IF NOT EXISTS "festival_news_festivalId_slug_key"
  ON "festival_news" ("festivalId", "slug");
