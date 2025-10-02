# Project Overview

This is a SvelteKit project for a back-office application called "TailorMade". It uses Supabase for the backend, including authentication and database services. The frontend is built with Svelte and styled with Tailwind CSS. It also uses Shadcn UI components and Zod for data validation.

## Key Technologies

*   **Framework:** SvelteKit
*   **Backend:** Supabase
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn Svelte
*   **Data Validation:** Zod
*   **Animations:** svelte-motion, clsx, tailwind-merge
*   **Icons:** lucide-svelte

# Building and Running

## Development

To run the application in development mode:

```bash
npm run dev
```

## Building

To build the application for production:

```bash
npm run build
```

## Testing

To run the unit tests:

```bash
npm run test
```

# Development Conventions

## Coding Style

The project uses Prettier for code formatting and ESLint for linting. You can format the code and check for linting errors with the following commands:

```bash
npm run format
npm run lint
```

## Testing Practices

The project has both client-side and server-side tests configured in `vite.config.ts`. Client-side tests are written for Svelte components and are located in the `src` directory with a `.svelte.{test,spec}.{js,ts}` extension. Server-side tests are also in the `src` directory with a `.{test,spec}.{js,ts}` extension, but exclude the Svelte component tests.
