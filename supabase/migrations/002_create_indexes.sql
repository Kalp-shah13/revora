-- ============================================================
-- Migration 002: Create performance indexes
-- ============================================================

-- Fast lookup of businesses by slug (used on every public review page load)
create index if not exists idx_businesses_slug on businesses(slug);

-- Fast lookup of businesses by owner (used in dashboard queries)
create index if not exists idx_businesses_owner on businesses(owner_id);

-- QR scan queries filtered by business and sorted by time
create index if not exists idx_scans_business on qr_scans(business_id, scanned_at);

-- Review queries filtered by business and sorted by time
create index if not exists idx_reviews_business on reviews(business_id, created_at);

-- Feedback queries filtered by business and status
create index if not exists idx_feedback_business on feedback(business_id, status);

-- Service tags by business
create index if not exists idx_service_tags_business on service_tags(business_id);
