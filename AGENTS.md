# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router application for diesel inventory and fleet performance.

- `src/app/(dashboard)/`: authenticated pages such as cargas, tanques, periodos, and catalogos.
- `src/app/actions/`: server actions and business rules. Keep database mutations here.
- `src/components/`: client UI grouped by feature; shared primitives live in `src/components/ui/`.
- `src/db/schema.ts`: Drizzle models and application-level relations.
- `src/lib/`: authorization, dates, reconciliation, Pusher, and shared utilities.
- `public/`: static assets and PWA files.
- `scripts/` and `migration/`: operational SQL and one-off data migration tools.

There is currently no automated test directory. Add new tests beside the feature or under `src/**/__tests__/`.

## Build, Test, and Development Commands

- `npm run dev`: run the local Webpack development server.
- `npm run build`: create a production Next.js build.
- `npm start`: serve the production build.
- `npm run lint`: run ESLint across the repository.
- `npx tsc --noEmit --incremental false`: perform a clean TypeScript check.
- `npm run db:push`: push the Drizzle schema. Use cautiously: production contains historical folio duplicates.
- `npm run db:studio`: inspect the configured Neon database.

No `npm test` command exists yet. Changes to folios, stock, or periods require documented manual verification until tests are introduced.

## Coding Style & Naming Conventions

Use TypeScript, two-space indentation, double quotes, and semicolons. Components and exported React types use `PascalCase`; functions, variables, and server actions use `camelCase`. Prefer Server Components unless browser state or interaction requires `"use client"`.

Keep mutations validated on the server, call the appropriate authorization guard, and revalidate affected routes. Use `TableScroll` for wide tables and explicit Tailwind widths such as `max-w-[1536px]`.

## Testing Guidelines

At minimum, run lint and TypeScript checks. Manually test success, validation failure, duplicate submission, and stale-page/concurrent submission paths. Inventory changes must verify both tank balances, cuentalitros, audit history, and rollback behavior.

## Commit & Pull Request Guidelines

History favors short, imperative subjects, often with prefixes such as `fix:`. Keep commits focused, for example: `fix: compartir folio entre patio y transferencias`.

PRs should include a concise problem statement, affected routes/actions, verification steps, linked issue, and screenshots for UI changes. Database changes require migration and rollback notes plus before/after integrity queries.

## Security & Configuration

Never commit `.env*`, database credentials, or raw SQL/Excel backups containing operational data. Confirm `DATABASE_URL` targets the intended Neon branch before resets, seeds, migrations, or `db:push`.
