-- ============================================================
-- Migration 005: Seed a test business for Phase 3 testing
-- Run this in Supabase SQL Editor AFTER creating your super admin user.
-- Replace the owner_id with your actual super admin user's UUID.
-- ============================================================

-- Step 1: Get your user ID (run this first to find it)
-- SELECT id, email FROM auth.users LIMIT 10;

-- Step 2: Insert a test business
-- Replace '00000000-0000-0000-0000-000000000000' with your actual user UUID from step 1

INSERT INTO businesses (
  owner_id,
  name,
  slug,
  google_review_link,
  accent_color,
  plan,
  is_active
)
SELECT
  id,                                          -- uses your super admin id as owner
  'Joe''s Cafe',
  'joes-cafe',
  'https://g.page/r/test-review-link',        -- replace with a real Google review link later
  '#D97706',
  'free',
  true
FROM profiles
WHERE role = 'super_admin'
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Add service tags for the test business
INSERT INTO service_tags (business_id, label)
SELECT b.id, unnest(ARRAY[
  'Fast Service',
  'Friendly Staff',
  'Great Ambience',
  'Excellent Food',
  'Good Value',
  'Clean & Tidy'
])
FROM businesses b
WHERE b.slug = 'joes-cafe'
ON CONFLICT DO NOTHING;

-- Step 4: Verify
SELECT
  b.name,
  b.slug,
  b.is_active,
  COUNT(t.id) AS tag_count
FROM businesses b
LEFT JOIN service_tags t ON t.business_id = b.id
WHERE b.slug = 'joes-cafe'
GROUP BY b.name, b.slug, b.is_active;
