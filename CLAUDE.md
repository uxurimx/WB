# CLAUDE.md — WB Construcción (Control Diesel)

Guía para Claude Code al trabajar en este repo. Proyecto en devmon: `wb-construccion` (id 53).

## Qué es

SaaS que digitaliza el control de **diesel y rendimiento de flota** de WB Construcción
(antes en Excel). En producción: **wbconstruccion.mx**.

Flujo del negocio:
- Se registran **cargas** de diesel a unidades (camiones/máquinas), con dos orígenes:
  **patio** (bomba con cuentalitros) y **campo** (la NISSAN reparte, capacidad 1200 L).
- El tanque se llena con **recargas** y se mueve diesel entre tanques con **transferencias**.
- Tipos de diesel por origen del combustible: normal (taller), amigo, oxxogas.
- **Períodos semanales sábado→viernes**. Al cerrar período se calcula el **rendimiento**
  por unidad: camiones `km/L` (último odómetro − odómetro período anterior, ÷ litros),
  máquinas `L/hr`.

## Stack

Next.js 16 (App Router) · Clerk (auth + roles) · Neon Postgres + Drizzle ORM ·
Pusher (real-time) · uploadthing (fotos odómetro) · Tailwind v4 · Zod.

- Roles con permiso de gestión: `admin`, `gerente`, `encargado_obra` (ver `MANAGE_ROLES`).
- Módulo **poxelbit** embebido (tickets/módulos/novedades) — soporte interno.

## Estructura clave

- `src/app/(dashboard)/cargas/` — Historial (tabla principal) + captura patio/campo.
- `src/app/(dashboard)/catalogo/` — unidades, operadores, obras (+ detalle con su historial).
- `src/app/(dashboard)/periodos/` — períodos y cierre con rendimientos.
- `src/app/actions/` — server actions (`cargas.ts`, `catalogo.ts`, `tanques.ts`, `periodos.ts`, `rendimientos.ts`).
- `src/db/schema.ts` — esquema Drizzle.
- `src/components/cargas/CargasTable.tsx` — tabla del historial (la más compleja).
- `src/components/ui/table-scroll.tsx` — wrapper de scroll reutilizable (ver abajo).

## Patrones y convenciones

- Server Components por defecto; `"use client"` solo para interactividad.
- Validación Zod en server actions antes de escribir a DB.
- Mutaciones hacen `revalidatePath`; el historial además mantiene cargas en estado local
  (paginadas) y refresca con `reloadCargas()` tras editar/eliminar.
- **Tailwind v4**: `max-w-screen-*` fue **removido**; usar valores explícitos (`max-w-[1536px]`).
- Tablas con scroll horizontal usan `<TableScroll>` (barra superior sincronizada para
  mouse + `maxHeight` opcional con header sticky). El `<Table>` de `ui/table.tsx` ya lo integra.

## Historial de cargas — cómo carga (importante)

- Default: **período actual** (`getPeriodoActualRange`, read-only, no crea períodos).
- Búsqueda/filtro origen/paginación de **cargas** son **server-side** (`getCargasPage`,
  `getCargas` con `search`). Botón "Cargar más".
- **Recargas y transferencias** son pocas → se cargan completas dentro de la ventana y se
  intercalan/filtran en cliente.
- Ventanas vía URL: default período | `?desde=&hasta=` explícito | `?todo=1` todo el historial.

## Notas / pendientes

- **Índices de cargas**: NO están en el schema a propósito. `db:push` intentaba recrear el
  índice único `cargas_folio_origen_unique` y fallaba por **folio 13393 duplicado en patio**.
  Si se quiere el extra de velocidad → `CREATE INDEX IF NOT EXISTS` manual en Neon
  (ver tarea devmon #306). El duplicado de folio es tarea #307.
- `db:push` puede tropezar con ese índice único + duplicado; cuidado al usarlo.

## Reglas de trabajo en este repo

- Ediciones quirúrgicas, **cero scope creep**: hacer solo lo pedido; lo extra se propone y se espera OK.
- Leer este archivo antes de tocar código.
