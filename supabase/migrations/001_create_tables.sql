-- ============================================================
-- Migration 001: Create all tables for ReviewFlow AI
-- Run this in your Supabase SQL Editor or via Supabase CLI
-- ============================================================

-- 1. profiles — extends auth.users with role and metadata
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('super_admin', 'business_owner')),
  created_at timestamptz default now()
);

-- 2. businesses — each client business registered on the platform
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  google_review_link text not null,
  logo_url text,
  accent_color text default '#D97706',
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. service_tags — selectable tags shown to customers on the review page
create table if not exists service_tags (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  label text not null,
  created_at timestamptz default now()
);

-- 4. qr_scans — logs every QR scan event before rating is known
create table if not exists qr_scans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  scanned_at timestamptz default now(),
  user_agent text
);

-- 5. reviews — positive path (4-5 star) submissions routed to Google
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  rating int not null check (rating between 4 and 5),
  selected_tags text[],
  ai_variant_chosen text,
  redirected_to_google boolean default false,
  created_at timestamptz default now()
);

-- 6. feedback — negative path (1-3 star) private submissions
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  rating int not null check (rating between 1 and 3),
  message text,
  contact_info text,
  status text default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz default now()
);
