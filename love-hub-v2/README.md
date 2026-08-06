# Love Hub v2

A private shared home for Rapha and Minette, built with Next.js, Vercel and Supabase.

## Current phase

This branch contains the redesigned application shell and the initial Supabase schema. It does not replace the legacy GitHub Pages site and does not contain real credentials or personal data.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project.
3. Run `supabase/migrations/001_initial_schema.sql` through migrations.
4. Add the Supabase URL and anon key to `.env.local`.
5. Run `npm install` and `npm run dev`.

## Privacy model

- One household represents Rapha and Minette's private space.
- Membership is tied to Supabase Auth users.
- Row Level Security is enabled on every personal table.
- The photo bucket is private.
- The service-role key must never be exposed to browser code.
- Liam may be referenced in family plans, but is not an authenticated account in the initial model.

## Promotion rules

- Keep the existing Love Hub live until the V2 preview is approved.
- Do not merge real Supabase credentials.
- Test both authorised accounts and a non-member account before production.
- Export legacy content before replacing the old site.
