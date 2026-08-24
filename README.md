# ReviewFlow AI

Google Review Automation SaaS — helps local businesses collect more positive Google reviews while privately capturing negative feedback.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| AI | OpenAI GPT-4o-mini |
| QR Codes | `qrcode` npm package |
| Hosting | Vercel |

---

## Local Development Setup

### 1. Prerequisites
- Node.js 18+
- A Supabase account and project
- An OpenAI account

### 2. Clone and install
```bash
git clone <repo-url>
cd reviewflow-ai
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env.local
```
Fill in your values in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run database migrations
Go to **Supabase Dashboard → SQL Editor** and run these files in order:
1. `supabase/migrations/001_create_tables.sql`
2. `supabase/migrations/002_create_indexes.sql`
3. `supabase/migrations/003_rls_policies.sql`
4. `supabase/migrations/004_profiles_trigger.sql`
5. `supabase/migrations/005_seed_test_business.sql` *(optional test data)*

### 5. Create your super admin account
1. Supabase Dashboard → Authentication → Users → Add User
2. After creating, run in SQL Editor:
```sql
UPDATE profiles SET role = 'super_admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

### 6. Start the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── (admin)/admin/          # Super admin panel
│   ├── (auth)/login/           # Login page
│   ├── (customer)/review/      # Public review flow + QR print page
│   ├── (dashboard)/dashboard/  # Business owner dashboard
│   └── api/                    # All API routes
│       ├── admin/              # Admin-only endpoints
│       ├── auth/               # Login/logout
│       ├── business/           # Public business data
│       ├── dashboard/          # Business owner endpoints
│       ├── review/             # Generate + submit reviews
│       └── scan/               # QR scan logging
├── components/
│   ├── admin/                  # Admin panel components
│   ├── dashboard/              # Dashboard components
│   ├── review/                 # Customer review flow components
│   ├── shared/                 # TopNav, UserMenu, ErrorBoundary
│   └── ui/                     # shadcn/ui components
├── hooks/
│   └── useAutoRefresh.ts       # 30s polling hook
├── lib/
│   ├── auth.ts                 # Server-side auth helpers
│   ├── db.ts                   # Typed database query helpers
│   ├── rate-limit.ts           # In-memory rate limiter
│   ├── utils.ts                # Shared utilities
│   └── supabase/               # Supabase client factories
└── types/
    ├── database.ts             # Full DB type map
    └── index.ts                # API + shared types
```

---

## User Roles

| Role | Access |
|---|---|
| `super_admin` | `/admin` — manage all businesses, platform analytics |
| `business_owner` | `/dashboard` — own business only (RLS enforced) |
| Anonymous | `/review/[slug]` — public review page, no login required |

---

## Key URLs

| URL | Description |
|---|---|
| `/` | Redirects based on auth state |
| `/login` | Sign in page |
| `/dashboard` | Business owner dashboard |
| `/admin` | Super admin panel |
| `/review/[slug]` | Customer-facing review page (public) |
| `/review/[slug]/qr` | Print-friendly QR code page |

---

## Deployment to Vercel

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)

### 3. Set environment variables
In Vercel Dashboard → Project → Settings → Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production domain e.g. `https://myapp.vercel.app`)

### 4. Create a production Supabase project
- Create a **separate** Supabase project for production
- Run all 4 migrations in the production SQL Editor
- Use production keys in Vercel env vars

### 5. Deploy
Click **Deploy** — Vercel will build and deploy automatically.

---

## Security

- All admin routes verify Supabase session + role server-side
- Service-role key never exposed to browser
- RLS policies enforce data isolation per business
- Input sanitization on all customer-submitted text
- Rate limiting on public API endpoints (10-30 req/min/IP)
- HTTPS enforced via Vercel

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key (JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT-4o-mini |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full URL of your app (used for QR codes) |
