# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit 5 application for managing beverages, ingredients, recipes, and blogs. The app uses **Supabase** for backend services (database, auth, storage) and **Tailwind CSS v4** for styling. The project leverages SvelteKit's **experimental remote functions** and **async features**.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run check` - Run svelte-check for type checking
- `npm run check:watch` - Run type checking in watch mode
- `npm run lint` - Run Prettier and ESLint checks
- `npm run format` - Format code with Prettier
- `npm test` - Run all tests
- `npm run test:unit` - Run tests in watch mode

### Testing
Tests are configured with Vitest in two modes:
- **Client tests**: `.svelte.{test,spec}.{js,ts}` files run in browser environment (Playwright/Chromium)
- **Server tests**: `.{test,spec}.{js,ts}` files run in Node environment
- Exclude server-only code from client tests

## Architecture

### Supabase Integration

The app uses three distinct Supabase client factories in `src/lib/supabase/`:

1. **`server.ts`** (Server-side):
   - `createServerClient()` - Full server client with cookie management
   - `createAdminClient()` - Admin client that bypasses RLS (uses `SUPABASE_SECRET_KEY`)
   - `createLimitedClient()` - Read-only client for query/prerender remote functions (cannot set cookies)

2. **`browse.ts`** (Client-side):
   - `createBrowserClient()` - Client-side Supabase client

3. **`shared.ts`** (Authentication helpers):
   - `getAuthenticatedUser()` - Returns current user or null
   - `requireAuthenticatedUser()` - Returns user or throws 401 error

**Important**: Use `createServerClient()` for remote functions that need to write cookies. Use `createLimitedClient()` for query/prerender functions.

### Remote Functions (SvelteKit Experimental)

This project uses **SvelteKit remote functions** (`experimental.remoteFunctions: true`), replacing traditional load functions and form actions in many places.

Remote function files are named `data.remote.ts` and use:
- `query()` - For read operations (can be cached, refreshed)
- `form()` - For form-based mutations
- `command()` - For programmatic mutations

**Example locations**:
- `src/routes/app/settings/recipes_settings/data.remote.ts`
- `src/routes/app/settings/ingridients_settings/data.remote.ts`
- `src/routes/app/blog/data.remote.ts`

**Validation**: Remote functions use Zod v4 schemas for type-safe validation.

### Async Svelte (Experimental)

The project enables **async Svelte** (`compilerOptions.experimental.async: true`), allowing:
- Top-level `await` in components
- `await` in `$derived()` expressions
- `await` in template expressions

**Requirement**: All async components must be wrapped in `<svelte:boundary>` with a `pending` snippet.

### Authentication Flow

Authentication is handled in `src/hooks.server.ts` with two hooks:
1. **`supabase` hook**: Creates Supabase client and `safeGetSession()` helper
2. **`authGuard` hook**: Validates session and redirects:
   - Unauthenticated users accessing `/private/*` → `/auth`
   - Authenticated users accessing `/auth` → `/private`

**Session management**: `event.locals` contains `supabase`, `session`, `user`, and `safeGetSession()`.

### State Management

**Profile Store** (`src/lib/stores/profile.svelte.ts`):
- Class-based reactive store using Svelte 5 runes (`$state`)
- Initialized in `/app` layout via `setProfileContext(profile)`
- Access with `getProfileContext()` from any child component

**Other stores**:
- `toast.svelte.ts` - Toast notifications
- `progress.svelte.ts` - Progress indicators

All stores use **Svelte 5 runes syntax** (`$state`, `$derived`, `$effect`).

### Database Types

TypeScript types are defined in `src/lib/models/database.types.ts`:
- `Blog`, `Beverage`, `Ingredient`, `RecipeIngredient`, `Profile`, `Organization`

These types should be kept in sync with the Supabase schema.

### Route Structure

```
src/routes/
├── +layout.svelte              # Root layout
├── app/                        # Authenticated app area
│   ├── +layout.svelte          # App shell with sidebar & breadcrumbs
│   ├── +layout.server.ts       # Loads user profile
│   ├── +page.svelte            # Dashboard/home
│   ├── blog/                   # Blog listing and detail pages
│   ├── recipes/                # Recipe listing and detail pages
│   ├── manifesto/              # Manifesto page
│   ├── profile/[id]/           # User profile pages
│   └── settings/               # Settings pages
│       ├── blog_settings/      # Blog management
│       ├── recipes_settings/   # Beverage/recipe management
│       └── ingridients_settings/ # Ingredient management
└── auth/                       # Auth pages (login, error)
```

### UI Components

The app uses **bits-ui** (headless UI library) with custom styling via Tailwind. Components are in `src/lib/components/ui/`:
- Follows shadcn-svelte pattern (compositions of bits-ui primitives)
- Custom components in `src/lib/components/custom/`
- App-specific components like `app-sidebar.svelte`, `nav-user.svelte`

## Code Patterns

### Supabase Queries
Always use `.overrideTypes<Type>()` for type safety:
```typescript
const { data, error } = await supabase
  .from('beverages')
  .select('*')
  .overrideTypes<Beverage[]>();
```

### Remote Function Patterns
```typescript
// Query with schema validation
export const getBeverage = query(beverageIdSchema, async ({ beverageId }) => {
  const supabase = createServerClient();
  // ... query logic
  return { success: true, data };
});

// Form with schema
export const addBeverage = form(addBeverageSchema, async (formData) => {
  // ... mutation logic
  return { success: true, message: 'Added' };
});

// Command for programmatic mutations
export const deleteBeverage = command(deleteSchema, async ({ id }) => {
  // ... delete logic
});
```

### File Uploads
File uploads to Supabase Storage follow this pattern:
1. Validate file (Zod schema with `.instanceof(File)`)
2. Generate unique filename: `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
3. Upload to bucket with path: `beverages/{id}/{filename}`
4. Get public URL via `supabase.storage.from(bucket).getPublicUrl(path)`
5. Store URL in database

## Environment Variables

Required environment variables (in `.env`):
- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Anon/public key
- `SUPABASE_SECRET_KEY` - Service role key (server-only)

## Important Notes

- **Never import server-only modules** (`$lib/server/*`, `.server.ts`) into client code
- **Use Svelte 5 syntax**: `$state`, `$derived`, `$effect`, `$props()`, `{@render}`, `{#snippet}`
- **Type definitions**: Import types from `./$types` in route files for type safety
- **Context API**: Use `setContext`/`getContext` for component state sharing (see ProfileStore)
- The project uses **Tailwind CSS v4** (`@tailwindcss/vite` plugin)
