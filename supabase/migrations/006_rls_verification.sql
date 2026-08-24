-- ============================================================
-- Migration 006: RLS Verification Queries
-- Run these in Supabase SQL Editor to verify RLS is working.
-- All checks should return the expected results.
-- ============================================================

-- 1. Verify RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'businesses', 'service_tags', 'qr_scans', 'reviews', 'feedback')
ORDER BY tablename;
-- Expected: rls_enabled = true for all 6 tables

-- 2. Count policies per table
SELECT
  tablename,
  COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- Expected: each table has at least 1 policy

-- 3. List all policies
SELECT
  tablename,
  policyname,
  cmd AS operation,
  qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verify trigger exists for auto profile creation
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
-- Expected: 1 row

-- 5. Verify all indexes exist
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_businesses_slug',
    'idx_businesses_owner',
    'idx_scans_business',
    'idx_reviews_business',
    'idx_feedback_business',
    'idx_service_tags_business'
  )
ORDER BY indexname;
-- Expected: 6 rows

-- 6. Check super admin exists
SELECT
  u.email,
  p.role,
  p.created_at
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE p.role = 'super_admin';
-- Expected: at least 1 row (your admin account)

-- 7. Check test business exists
SELECT
  name,
  slug,
  is_active,
  plan
FROM businesses
WHERE slug = 'joes-cafe';
-- Expected: 1 row with is_active = true
