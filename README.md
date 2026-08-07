# Love You Most +1 — Love Hub

A private, mobile-first shared home for Rapha and Minette, built with Next.js, TypeScript, Vercel and Supabase.

## Product experience

Love Hub is designed around the life two people actually share rather than a generic dashboard. It includes:

- a personal home screen with the next plan, latest note, daily prompt and relationship highlights;
- a chronological relationship story;
- private memories with photo uploads, favourites, editing and deletion;
- shared plans with ideas, dates, family flags and completion states;
- a movie and series watchlist with progress and ratings;
- a shared adventure bucket list;
- private notes that update in realtime;
- profile, household and secure one-time partner-invitation settings;
- sign-in, sign-up, email confirmation and password recovery flows;
- responsive desktop, tablet and phone layouts with accessible focus and reduced-motion support.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Apply `supabase/migrations/001_initial_schema.sql`.
4. Apply `supabase/migrations/002_complete_love_hub.sql`.
5. Run `npm install` and `npm run dev`.

## Validation

Every Vercel deployment must pass:

```bash
npm run lint
npm run typecheck
npm run build
```

## Privacy model

- Supabase Auth controls sign-in.
- Every personal table uses Row Level Security and household membership checks.
- Photos live in a private bucket and are displayed through temporary signed URLs.
- Partner invitations are one-time, expire after seven days and are stored only as SHA-256 hashes.
- The browser receives only the Supabase publishable key; no service-role key is used or exposed.
- Love Hub tables are namespaced inside the shared `rapha-personal-apps` Supabase project.

## Release policy

- The original Love Hub remains unchanged on `main` until this version is explicitly approved.
- The redesign stays in a draft pull request while authenticated and mobile smoke testing is completed.
- Database migrations are additive and kept under version control.
- Never commit real passwords, secret keys or service-role credentials.
