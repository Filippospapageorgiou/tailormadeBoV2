# TailorMade BoV2 — CLAUDE.md

> This file is the single source of truth for AI agents working on this project.
> Read this before doing anything else.
>
> For deeper context, read the reference docs in `.claude/skills/tailormade-bov2/references/`:
> - `architecture.md` — stack, folder structure, data flow, deployment
> - `conventions.md` — coding patterns, naming, store pattern, styling
> - `roadmap.md` — feature status, planned work, known issues

## What this project is
TailorMade BoV2 is a multi-tenant coffee shop management platform for the Tailor Made & Venetis coffee chain. It handles staff management, scheduling, daily tasks, beverage recipes, equipment tracking, register closings, bonus calculations, trainer evaluations, blogs, manuals, and an AI data assistant. The app serves three role levels: super admins (role_id 1), managers (role_id 2), employees, and trainers (role_id 3). It is in active development, deployed on Vercel.

## Stack
- **Frontend**: SvelteKit 2 (Svelte 5 with runes), TypeScript, SSR + client hybrid
- **Styling**: Tailwind CSS v4 + shadcn-svelte (bits-ui based) + tw-animate-css + custom coffee-themed palette
- **Backend**: Supabase (Auth, PostgreSQL, Storage, RLS) — no Edge Functions
- **AI**: Anthropic Claude API via `@ai-sdk/anthropic` + Vercel AI SDK (`ai` package)
- **Email**: Resend for transactional emails (invitations, notifications)
- **Maps**: MapLibre GL for store location maps
- **Charts**: LayerChart + D3 for data visualization
- **Deployment**: Vercel (adapter-vercel, Node.js 20.x runtime)
- **Key libs**: zod (validation), date-fns, exceljs (Excel export), marked + DOMPurify (markdown), svelte-sonner (toasts), embla-carousel-svelte, @dnd-kit-svelte (drag and drop), svelte-motion

## Project structure
```
src/
├── app.css                    # Tailwind v4 config + coffee theme CSS variables
├── app.d.ts                   # SvelteKit type augmentation (Locals: supabase, session, user)
├── app.html                   # HTML shell
├── hooks.server.ts            # Supabase SSR client + auth guard (protects /private, redirects /auth)
├── lib/
│   ├── api/                   # Domain-specific API modules (blog, bonus, equipment, etc.)
│   ├── animated/icons/        # Animated SVG icon components
│   ├── components/
│   │   ├── ai-elements/       # AI chat UI components (messages, prompts, code blocks)
│   │   ├── ai/                # AI system prompt + tool definitions
│   │   ├── app-sidebar.svelte # Main app sidebar navigation
│   │   ├── bonus_table/       # Bonus period data tables
│   │   ├── command/           # Command palette (Cmd+K)
│   │   ├── custom/            # Domain-specific components (register, hero, recipes, etc.)
│   │   ├── nav-*.svelte       # Navigation sub-components
│   │   ├── Reusable/          # Shared reusable components (DeleteConfirmDialog)
│   │   ├── stats_organization/# Organization statistics charts
│   │   ├── trainer/           # Trainer evaluation components
│   │   └── ui/                # shadcn-svelte UI primitives (40+ component sets)
│   ├── config/                # Feature access flags (org-level feature gating)
│   ├── db/                    # SQL schema reference (scehma.sql)
│   ├── droppable.svelte       # DnD utility
│   ├── emails/                # Resend email templates (invitations, evaluations, etc.)
│   ├── hooks/                 # Custom Svelte hooks (is-mobile, use-clipboard)
│   ├── models/                # TypeScript interfaces (database types, domain types)
│   ├── schemas/               # Zod validation schemas (auth)
│   ├── stores/                # Svelte 5 rune-based state stores (profile, evaluation, etc.)
│   ├── supabase/              # Supabase client factory (browser, server, admin, queries)
│   └── utils.ts               # Shared utility functions (cn, formatCurrency, geocode, etc.)
├── routes/
│   ├── +layout.server.ts      # Root layout: session + profile + role-based routing
│   ├── +layout.ts             # Universal layout: browser/server Supabase client
│   ├── +layout.svelte         # Root layout component
│   ├── api/                   # API endpoints (ai/optimize-markdown)
│   ├── app/                   # Main app routes (employees + managers)
│   │   ├── +layout.svelte     # App shell: sidebar, breadcrumbs, notifications, theme
│   │   ├── blog/              # Blog reading
│   │   ├── daily_tasks/       # Daily task board (DnD)
│   │   ├── equipment/         # Equipment catalog
│   │   ├── manuals/           # Manual reading
│   │   ├── managment/         # Admin-only: org management, bonus, trainers, AI, blogs, recipes
│   │   ├── profile/           # User profile
│   │   ├── recipes/           # Beverage recipes
│   │   ├── register/          # Daily register closing (feature-gated)
│   │   ├── schedule/          # View weekly schedule
│   │   └── settings/          # Manager settings: users, schedule, equipment, register, tasks
│   ├── auth/                  # Auth routes: login, forgot password, reset, confirm, logout
│   ├── invite/                # Organization invitation acceptance
│   └── trainer/               # Trainer portal: evaluations, profile
```

## How to run
```bash
npm install
npm run dev
```

Required env vars (see `.env`):
- `PUBLIC_SUPABASE_URL` — Supabase project URL
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `SUPABASE_SECRET_KEY` — Supabase service role key (server-only)
- `ANTHROPIC_API_KEY` — Claude API key for AI assistant
- `RESEND_API_KEY` — Resend email API key

## Critical rules — read before touching code

1. **Supabase client usage**: Use `createServerClient()` from `$lib/supabase/server` in server-side code (`+page.server.ts`, `data.remote.ts`, `+server.ts`). Use `event.locals.supabase` in hooks and layouts. Use `createBrowserClient()` from `$lib/supabase/browse` only in browser-only contexts. Use `createAdminClient()` only when bypassing RLS is explicitly required.

2. **Remote functions pattern**: Data fetching uses SvelteKit's experimental `query()` from `$app/server` in `data.remote.ts` files co-located with routes. These are the primary server data access pattern — NOT `+page.server.ts` load functions for most feature routes.

3. **Role-based access**: role_id 1 = super admin, role_id 2 = manager, role_id 3 = trainer. Route guards are in `+layout.server.ts` (root). `/app/managment/` is admin-only (role_id 1). `/app/settings/` is for managers (role_id 1 or 2). `/trainer/` is trainer-only. Always check roles server-side.

4. **State management uses Svelte 5 runes**: Stores in `$lib/stores/` use `$state()`, `$derived()`, and Svelte context (`setContext`/`getContext`). The `ProfileStore` is the primary user state — set in the root layout, accessed via `getProfileContext()`.

5. **UI components**: Use shadcn-svelte components from `$lib/components/ui/`. Use `cn()` from `$lib/utils` for class merging. The theme is a custom coffee palette defined in `app.css` with oklch colors.

6. **Greek language**: The app UI is primarily in Greek. Labels in sidebar, breadcrumbs, and user-facing text are in Greek. Use Greek for new user-facing strings.

7. **Feature gating**: Some features (e.g., register) are gated per-organization via `$lib/config/feature-access.ts`. Check `orgHasFeature()` before showing feature UI.

8. **TypeScript types**: Domain types live in `$lib/models/`. Use `overrideTypes<T>()` on Supabase queries for type safety. The DB has known typos in table/column names (e.g., `trainer_org_assigments`, `evalution_id`) — match them exactly.

9. **Email notifications**: All email sending uses Resend via templates in `$lib/emails/`. The production URL is `https://tailormadebov2.app`.

10. **Auth flow**: Supabase Auth with email/password. JWT validated via `safeGetSession()` in hooks. Password reset via verification codes. Organization invitations use token-based acceptance at `/invite/accept`.

## Auth model
- **Provider**: Supabase Auth (email/password)
- **Session handling**: Server-side via `@supabase/ssr` cookies. `hooks.server.ts` creates per-request Supabase client and validates JWT with `getUser()`
- **Route protection**: Root `+layout.server.ts` enforces role-based redirects. Unauthenticated users go to `/auth/login`. Trainers can't access `/app/`, non-trainers can't access `/trainer/`
- **RLS**: Enabled on Supabase. Server uses service role key for admin operations
- **Profile**: Stored in `profiles` table, linked to `auth.users` via UUID. Loaded in root layout and distributed via Svelte context

## Database
Key tables (full schema in `$lib/components/ai/Systemprompt.ts` and `$lib/db/scehma.sql`):
- `profiles` — User profiles (UUID PK, linked to auth.users)
- `core_organizations` — Multi-tenant organizations
- `beverages` / `ingredients` / `recipe_ingredients` — Recipe system
- `equipment` / `maintenance_logs` — Equipment tracking
- `weekly_schedules` / `shifts` / `shift_change_requests` — Scheduling
- `daily_register_closings` / `suppliers` — Register/finance (feature-gated)
- `task_templates` / `task_items` / `user_daily_tasks` / `user_weekly_tasks` / `user_monthly_tasks` — Task system
- `bonus_periods` / `bonus_organization_data` / `bonus_employee_payouts` — Bonus system
- `blogs` / `blog_reads` — Blog system
- `manuals` / `manual_reads` — Manual system
- `store_evaluations` / `evaluation_section_items` / `evaluation_barista_training` — Trainer evaluations
- `notifications` — In-app notifications
- `organization_invitations` / `trainer_invitations` — Invitation system

**Known DB typos** (match exactly):
- Table: `trainer_org_assigments` (one 's')
- Column: `store_evaluations.submit` (not `status`)
- Column: `evaluation_summary_actions.evalution_id` (not `evaluation_id`)

## State management
- **Svelte 5 rune stores**: Class-based stores with `$state()` fields, set via `setContext()` in layouts
  - `ProfileStore` — current user profile (set in root layout)
  - `TrainerAssignmentOrgClass` — trainer org assignment state
  - Various evaluation stores for the trainer evaluation flow
- **Server data**: `data.remote.ts` files using `query()` (SvelteKit experimental remote functions)
- **Page data**: `+page.server.ts` load functions for pages needing server-side data
- **URL state**: Used for pagination, filters (standard SvelteKit patterns)

## Where things live
| Thing | Location |
|-------|----------|
| Supabase client (browser) | `src/lib/supabase/browse.ts` |
| Supabase client (server) | `src/lib/supabase/server.ts` |
| Supabase shared queries | `src/lib/supabase/queries.ts` |
| Auth logic | `src/hooks.server.ts` + `src/routes/+layout.server.ts` |
| Shared types | `src/lib/models/*.types.ts` |
| Zod schemas | `src/lib/schemas/auth.ts` |
| API routes | `src/routes/api/` + `src/routes/app/managment/ai_assistant/api/` |
| UI primitives | `src/lib/components/ui/` (shadcn-svelte) |
| Custom components | `src/lib/components/custom/` |
| Domain components | `src/lib/components/trainer/`, `src/lib/components/stats_organization/` |
| Email templates | `src/lib/emails/` |
| State stores | `src/lib/stores/` |
| AI system prompt | `src/lib/components/ai/Systemprompt.ts` |
| Feature flags | `src/lib/config/feature-access.ts` |
| Utility functions | `src/lib/utils.ts` |

## What I'm actively working on
<!-- TODO: fill in current focus / open tasks -->
