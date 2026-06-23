# Admin Panel (Next.js 15)

Enterprise-grade admin dashboard for GehnaHub.

## Tech Stack

- Next.js App Router + TypeScript
- TailwindCSS + reusable shadcn-style UI primitives
- Zustand for global state
- Axios + TanStack Query for API architecture
- Supabase Auth SSR + role-based guards
- Recharts for analytics

## Setup

```bash
cd admin-panel
cp .env.example .env.local
npm install
npm run dev
```

## Production Architecture

- Feature routes in `src/app/(dashboard)`
- Shared API layer in `src/lib/api`
- Supabase SSR clients in `src/lib/supabase`
- Role checks in `src/lib/auth`
- Shared UI in `src/components`
- Global state in `src/store`

## Security Notes

- Role checks use `app_metadata.role` (not user editable metadata)
- Middleware enforces authenticated access
- Server layout performs role-based verification for protected routes
- Tokens are never hardcoded and come from environment/session
