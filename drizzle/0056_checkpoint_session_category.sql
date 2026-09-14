-- Add optional category scope to checkpoint sessions.
-- When set, only participants in that category may be scanned and the
-- roster is filtered to that category automatically.
ALTER TABLE "checkpoint_session"
  ADD COLUMN "category_id" text
    REFERENCES "category"("id") ON DELETE SET NULL;
