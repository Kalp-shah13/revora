# Revora

AI Google Review & Reputation Automation SaaS platform designed for local businesses and multi-location franchises to accelerate positive Google reviews while privately routing negative customer feedback.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 16 (App Router + Turbopack) |
| Frontend Language | TypeScript |
| UI & Styling | Tailwind CSS (Strict Light Theme) + Lucide Icons |
| Backend Framework | NestJS 12 (Express Engine) |
| API Standard | RESTful Architecture (`/api/v1`) |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| Authentication | JWT (HTTP-only secure session cookies) + RolesGuard |
| AI Engines | Google Gemini (`gemini-3.5-flash-lite`) with OpenAI fallback |
| Email Service | Nodemailer / SMTP (real-time negative feedback alerts) |
| Print & Stand Studio | Browser vector printing engine with real physical stand formats |

---

## Architecture Overview

Revora uses a decoupled, production-grade microservices-ready structure:

1. **Frontend (`/`)**: Next.js 16 web application handling customer review flows, business owner dashboards, super admin control panel, and the print marketing studio. Protected via Edge proxy ([src/proxy.ts](file:///e:/AI%20Review%20System/AI-Review-System/src/proxy.ts)).
2. **Backend (`/backend`)**: Modular NestJS application providing authenticated APIs under `/api/v1/`, role-based access control, PostgreSQL persistence via Prisma, AI review generation, QR code generation, and SMTP notification dispatching.

---

## Local Development Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database running locally or in Docker (default port: 5432)
- Google Gemini API Key or OpenAI API Key

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/review_system?schema=public"

# JWT Authentication
JWT_SECRET="revora-jwt-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Port
PORT=4000

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# AI Provider (Google Gemini recommended)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash-lite"

# Optional: OpenAI API Key (used as fallback)
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"

# SMTP Alerting (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Revora Alerts <your-email@gmail.com>"
```

Run Prisma migrations and seed the database:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Start the backend development server:
```bash
npm run start:dev
```
Backend API will be active at: `http://localhost:4000/api/v1`

---

### 3. Frontend Setup

In the root directory:
```bash
npm install
```

Create a `.env.local` file:
```env
BACKEND_INTERNAL_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Start the frontend development server:
```bash
npm run dev
```
Frontend will be accessible at:
- Local: `http://localhost:3000`
- Network: `http://192.168.1.200:3000`

---

## Key Routes & URLs

| URL | Access | Purpose |
|---|---|---|
| `/` | Public | Automatic routing based on authentication state |
| `/login` | Public | Authentication portal |
| `/dashboard` | Business Owner | Branch management, analytics, private feedback inbox, QR studio |
| `/admin` | Super Admin | Platform-wide metrics, business creation, and branch drawer |
| `/review/[slug]` | Public | Customer review flow with AI generation & tag selector |
| `/review/[slug]/qr` | Public | Print-friendly instant QR display |

---

## Security Features

- **Strict Role-Based Access Control**: Super admin and business owner role verification via NestJS `RolesGuard` and Next.js `proxy.ts`.
- **IDOR Protection**: Business ownership checks enforced on all feedback and business querying endpoints.
- **Privilege Escalation Prevention**: Registration endpoints lock user roles strictly to `BUSINESS_OWNER`.
- **Brute-Force Rate Limiting**: Dedicated `AuthRateLimitGuard` restricts authentication attempts per client IP.
- **AI Prompt Injection Defense**: Input length limits, prompt delimiters, and system override boundaries to ensure generated reviews stay authentic and grounded.
- **Zero-Emoji Professional Policy**: Clean corporate interface using SVG Lucide icons and pure light theme.
