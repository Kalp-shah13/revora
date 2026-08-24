-- Migration 007: Add tag_type column to service_tags
-- Allows distinguishing 'service' tags from 'category' tags
-- Defaults to 'service' so existing tags are unaffected

ALTER TABLE service_tags
  ADD COLUMN IF NOT EXISTS tag_type TEXT NOT NULL DEFAULT 'service'
  CHECK (tag_type IN ('service', 'category'));

-- Backfill: existing tags stay as 'service'
UPDATE service_tags SET tag_type = 'service' WHERE tag_type IS NULL;
