-- ============================================================
-- Migration 003: Enable RLS and create all policies
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table service_tags enable row level security;
alter table qr_scans enable row level security;
alter table reviews enable row level security;
alter table feedback enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================

-- Users can read their own profile only
create policy "profiles_owner_select"
  on profiles for select
  using (id = auth.uid());

-- Users can update their own profile
create policy "profiles_owner_update"
  on profiles for update
  using (id = auth.uid());

-- ============================================================
-- BUSINESSES
-- ============================================================

-- Business owners can SELECT their own business
create policy "businesses_owner_select"
  on businesses for select
  using (owner_id = auth.uid());

-- Business owners can UPDATE their own business
create policy "businesses_owner_update"
  on businesses for update
  using (owner_id = auth.uid());

-- Anyone (anon) can SELECT active businesses — needed for public review page
-- Only non-sensitive columns are actually used via the API layer
create policy "businesses_public_select_active"
  on businesses for select
  using (is_active = true);

-- ============================================================
-- SERVICE TAGS
-- ============================================================

-- Business owner can manage tags for their own business
create policy "service_tags_owner_manage"
  on service_tags for all
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Anyone can SELECT service tags (needed for public review page)
create policy "service_tags_public_select"
  on service_tags for select
  using (
    business_id in (
      select id from businesses where is_active = true
    )
  );

-- ============================================================
-- QR SCANS
-- ============================================================

-- Business owner can SELECT scans for their business
create policy "qr_scans_owner_select"
  on qr_scans for select
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Anyone (anon) can INSERT a scan — public event logging
create policy "qr_scans_public_insert"
  on qr_scans for insert
  with check (
    business_id in (
      select id from businesses where is_active = true
    )
  );

-- ============================================================
-- REVIEWS
-- ============================================================

-- Business owner can SELECT reviews for their business
create policy "reviews_owner_select"
  on reviews for select
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Anyone (anon) can INSERT a review (positive path submission)
create policy "reviews_public_insert"
  on reviews for insert
  with check (
    business_id in (
      select id from businesses where is_active = true
    )
  );

-- ============================================================
-- FEEDBACK
-- ============================================================

-- Business owner can SELECT feedback for their business ONLY
create policy "feedback_owner_select"
  on feedback for select
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Business owner can UPDATE feedback status (mark as resolved)
create policy "feedback_owner_update"
  on feedback for update
  using (
    business_id in (
      select id from businesses where owner_id = auth.uid()
    )
  );

-- Anyone (anon) can INSERT feedback (negative path submission)
create policy "feedback_public_insert"
  on feedback for insert
  with check (
    business_id in (
      select id from businesses where is_active = true
    )
  );

-- ============================================================
-- NOTE on Super Admin
-- All Super Admin operations use the service-role key (server-side only)
-- which inherently bypasses RLS. No separate RLS policy needed.
-- This keeps the policy set simple and auditable.
-- ============================================================
