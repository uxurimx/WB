# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 16 App Router application for diesel inventory and fleet performance.

- `src/app/(dashboard)/`: authenticated pages such as cargas, tanques, periodos, catalogos, and **taller** (bitácora).
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

---

## Current work — bitácora de taller (do not merge to `main` until tested)

**Branch:** `feat/bitacora-taller` (tracks `origin/feat/bitacora-taller`). Production/`main` is diesel-only.

**What the client asked for:** digitize the two paper sheets used when a unit **enters the workshop** (checklist de ingreso + orden de servicio). A helper opens the order; Isaac closes it with parts, supplier, and invoice. Each visit must also appear on that unit’s ficha. This is **not** inventory (barcode/stock of parts) and **not** field inspections (he still uses photos/PDF for that).

**Product flow (keep it this way):**

1. `/taller` list: **Nueva** opens a **modal** with arrival data only (unidad, fecha, km acumulado, operador, motivo, quién recibe). Save → modal closes → card appears in the list. Do not put checklist or parts in the create modal.
2. Open a card → `/taller/[id]` with three tabs: **Datos | Checklist | Refacciones**.
3. Checklist: Bien/Falla using **system indigo**, not green/red. Cards **collapse even when Falla** is selected; tap the title to expand notes/photos. Multiple notes + camera photos per item (`tallerFoto` UploadThing).
4. Refacciones: **list only**. **Agregar** opens a modal. Empty stacked forms are forbidden on mobile.
5. **Autosave** on field changes (debounce ~800ms). No “Guardar cambios” button. **Cerrar · ya terminó** and **Anular** (with confirm) only for `canCerrar` (`MANAGE_ROLES`: admin, gerente, encargado_obra).
6. Second list tab **Programados**: km/hrs alerts already in mantenimiento. **Atender** opens the same create modal with unidad + preventivo. If an open preventivo order exists for that unit/tipo, it must not appear again. Closing a preventivo order calls `registrarMantenimientoUnidad` **once** (skip if `evento_mantenimiento_id` set or an event exists same unit+tipo+fecha).

**Permissions:** nav permission `taller` on admin, gerente, encargado_obra, despachador (`src/lib/permissions.ts`). Merge TS map ∪ DB JSON via `mergeRolePermisos` so a stale `roles.permisos` cannot hide new items (this already bit us with **Tanques**).

**Schema / SQL:** `ordenes_taller`, `orden_checklist` (+ `fotos` JSON text), `orden_refacciones`, `orden_taller_log`. Apply `scripts/taller-ordenes.sql` plus later ALTERs (`actualizado_por_id`, `orden_taller_log`, `orden_checklist.fotos`) if the target Neon is not the one used in this branch. **Never `db:push` blindly** — unique folio index history.

**Key files:**

- `src/app/actions/taller.ts` — create/list/save/close/cancel, programados, suggested parts, user names, audit log.
- `src/app/(dashboard)/taller/` — list, `[id]`, `nueva` (redirects to `?nueva=1` modal).
- `src/components/taller/` — `TallerBoard`, `OrdenNuevaForm`, `OrdenDetalleForm`, `ChecklistIngreso`.
- Unit ficha tab Bitácora: `UnidadBitacoraTab` + `CatalogoDetalleClient`.

**Do not:** move diesel liters from taller; treat “Taller”/“OXXO GAS”/“NOTA PARA CORTE” as obras; build a parts warehouse; mix field checklists into this module.

**Related diesel context already on `main`:** atomic tank consume/restore; hubodómetro reset (`odometro_resets` + `unidades.odometro_offset`); km validation server-side; dates pinned to `America/Monterrey` (`src/lib/date-utils.ts`); PWA icons under `/public/icons/` and **always** `/logo.png` (relative `logo.png` 404s as `/taller/logo.png` and hits `[id]`). Nav: Carga patio, Carga campo, **Tanques** (not buried in Análisis).

**Client timezone:** Monterrey UTC−6 year-round. Do not use `new Date()` calendar day on the Vercel UTC server for “hoy”.

**When done testing:** merge `feat/bitacora-taller` → `main` only after helper create → checklist photos → parts modal → close preventivo without duplicate event.
