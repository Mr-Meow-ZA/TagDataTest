# Love Hub product and UX rationale

The completed Love Hub experience was designed after reviewing mature open-source product patterns and current platform guidance.

## Product principles

1. **Content before chrome.** Memories, plans and notes should dominate the screen; navigation should stay quiet.
2. **Five mobile destinations maximum.** The phone navigation prioritises Today, Memories, Plans, Notes and Story. Watchlist, Adventures and Settings remain one tap away inside the product.
3. **Progressive disclosure.** Editing and destructive controls live in expandable drawers so the default view remains emotional rather than administrative.
4. **Large, forgiving touch targets.** Primary interactive controls are at least 44 pixels high, with visible keyboard focus.
5. **Private by default.** Authentication, Row Level Security, a private storage bucket and signed image URLs are treated as product features, not backend details.
6. **Two-person collaboration, not generic social software.** The app optimises for one household, one shared history and low-friction rituals rather than feeds, followers or engagement mechanics.
7. **Graceful empty states.** A new household should feel inviting even before it contains data.
8. **Accessible motion.** The interface honours reduced-motion preferences and avoids animation that blocks reading or interaction.

## Patterns reviewed

- shadcn/ui — composable, accessible open-code components and restrained interface primitives.
- Cal.com — clear scheduling hierarchy, strong responsive behaviour and focused actions.
- Twenty — structured records, activity views and calm information density.
- Apple Human Interface Guidelines — mobile tab-bar hierarchy, safe-area behaviour and touch ergonomics.
- WCAG 2.2 — focus visibility, target size, labelling and predictable interaction.
- Supabase documentation — SSR authentication, Row Level Security, private Storage and realtime database changes.
- Motion Primitives and Magic UI — selective, lightweight polish without turning the product into an animation demo.

## Architecture choices

- Next.js App Router and server actions keep authenticated reads and writes close to the UI.
- Supabase remains the source of truth for authentication, structured records, photos and realtime refresh.
- Every personal table is prefixed with `love_hub_` because the Supabase project is shared with other personal apps.
- Vercel requires lint, strict TypeScript checking and a production build before a deployment can become active.
- The original Love Hub on `main` remains untouched until this draft is explicitly approved.
