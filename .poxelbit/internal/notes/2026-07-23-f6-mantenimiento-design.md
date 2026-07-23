# F6 — Diseño Técnico de Alertas de Mantenimiento Preventivo

Fecha: 2026-07-23
Proyecto: WB Construcción — Control Digital de Diesel
Feature: F6 — Alertas de mantenimiento preventivo por unidad
Estado: diseño aprobado para implementación

---

## 1. Objetivo funcional

Implementar un sistema de mantenimiento preventivo por unidad que permita:

- Configurar intervalos de mantenimiento por `km` y/o `hrs`
- Registrar servicios realizados con historial
- Calcular cuánto falta para el próximo mantenimiento
- Mostrar estados `ok`, `proximo`, `vencido`, `sin_config`
- Mostrar alertas visibles en catálogo y dashboard

Decisiones cerradas con el cliente/producto:

- Aplica también a `nissan`
- Una unidad puede usar ambos tipos de control: `km` y `hrs`
- Puede haber ambos planes activos para la misma unidad
- La alerta se calcula por lectura, no por calendario
- Deben existir todos los estados visuales
- Solo `admin` y `gerente` pueden configurar y registrar mantenimientos

---

## 2. Lectura del sistema actual

El sistema ya tiene base suficiente para F6:

- `unidades.odometroActual` como lectura actual operativa
- `cargas.odometroHrs` como historial de lecturas
- catálogo de unidades con tabla y vista detalle
- dashboard con infraestructura de alertas

Lo que no existe todavía:

- modelo de datos de mantenimiento
- historial de servicios
- lógica de cálculo de mantenimiento
- alertas de mantenimiento en overview

---

## 3. Modelo de datos propuesto

Se agregan 2 tablas nuevas:

### 3.1 `mantenimientosPlanes`

Configuración activa de mantenimiento por unidad y tipo de control.

Campos:

- `id: serial pk`
- `unidadId: integer not null`
- `tipoControl: varchar(10) not null`
  - valores: `km`, `hrs`
- `intervalo: real not null`
- `umbralAlerta: real not null`
- `activo: boolean not null default true`
- `notas: text`
- `createdAt: timestamp default now`
- `updatedAt: timestamp default now`

Restricción:

- único por `unidadId + tipoControl`

Justificación:

- permite un plan por `km` y otro por `hrs` para la misma unidad
- evita configuraciones activas duplicadas del mismo tipo

### 3.2 `mantenimientosEventos`

Historial de servicios y cambios de base de mantenimiento.

Campos:

- `id: serial pk`
- `unidadId: integer not null`
- `planId: integer null`
- `tipoControl: varchar(10) not null`
  - valores: `km`, `hrs`
- `fechaServicio: date not null`
- `lecturaServicio: real not null`
- `descripcion: text`
- `notas: text`
- `registradoPorId: text`
- `createdAt: timestamp default now`

Uso:

- cada registro representa un servicio realizado o fijación manual de nueva base
- el evento más reciente por `unidadId + tipoControl` es la base del cálculo

### 3.3 Relaciones Drizzle

- `unidades` -> many `mantenimientosPlanes`
- `unidades` -> many `mantenimientosEventos`
- `mantenimientosPlanes` -> one `unidad`
- `mantenimientosPlanes` -> many `mantenimientosEventos`
- `mantenimientosEventos` -> one `unidad`
- `mantenimientosEventos` -> one `plan`

---

## 4. Fuente de verdad para lecturas

Para F6 la lectura actual principal será:

- `unidades.odometroActual`

Razones:

- ya se actualiza al registrar cargas
- permite consultas rápidas para catálogo/dashboard
- evita recalcular cada alerta recorriendo todas las cargas

`cargas.odometroHrs` sigue siendo respaldo/auditoría histórica.

---

## 5. Reglas de cálculo

El cálculo se hace por cada plan activo:

- tomar lectura actual de la unidad
- tomar el último evento del mismo `tipoControl`
- calcular:
  - `recorridoDesdeServicio = lecturaActual - lecturaServicio`
  - `proximoServicioEn = lecturaServicio + intervalo`
  - `faltante = proximoServicioEn - lecturaActual`

### 5.1 Estados por plan

- `sin_config`
  - no hay plan
  - no hay evento base
  - no hay lectura actual
  - lectura actual < lectura base

- `ok`
  - `faltante > umbralAlerta`

- `proximo`
  - `0 <= faltante <= umbralAlerta`

- `vencido`
  - `faltante < 0`

### 5.2 Estado global por unidad

Si la unidad tiene varios planes:

- `vencido` si cualquier plan está vencido
- `proximo` si ninguno está vencido y al menos uno está próximo
- `ok` si al menos uno está ok y ninguno está próximo/vencido
- `sin_config` si no hay ningún plan útil

### 5.3 Casos de inconsistencia

Si `lecturaActual < lecturaServicio`:

- no se debe inventar estado normal
- se marca como `sin_config`
- debe mostrarse como inconsistencia en la UI de detalle

Esto deja a F6 preparada para convivir con futuros resets de odómetro.

---

## 6. Tipos TypeScript sugeridos

```ts
export type TipoControlMantenimiento = "km" | "hrs";
export type EstadoMantenimiento = "sin_config" | "ok" | "proximo" | "vencido";

export type ResumenPlanMantenimiento = {
  planId: number | null;
  unidadId: number;
  tipoControl: TipoControlMantenimiento;
  activo: boolean;
  intervalo: number | null;
  umbralAlerta: number | null;
  lecturaActual: number | null;
  lecturaServicio: number | null;
  fechaServicio: string | null;
  proximoServicioEn: number | null;
  faltante: number | null;
  excedente: number | null;
  estado: EstadoMantenimiento;
  inconsistencia: string | null;
};

export type ResumenMantenimientoUnidad = {
  unidadId: number;
  unidadCodigo: string;
  estadoGlobal: EstadoMantenimiento;
  planes: ResumenPlanMantenimiento[];
};
```

---

## 7. Server actions necesarias

Archivo sugerido:

- `src/app/actions/mantenimiento.ts`

Funciones:

- `getPlanesMantenimientoUnidad(unidadId)`
- `getEventosMantenimientoUnidad(unidadId)`
- `getResumenMantenimientoUnidad(unidadId)`
- `getResumenMantenimientoUnidades()`
- `getAlertasMantenimientoOverview()`
- `upsertPlanMantenimiento(input)`
- `registrarMantenimientoUnidad(input)`
- `togglePlanMantenimiento(planId, activo)`

### 7.1 Validaciones de negocio

En `upsertPlanMantenimiento`:

- `intervalo > 0`
- `umbralAlerta >= 0`
- `umbralAlerta < intervalo`
- `tipoControl` en `km | hrs`
- solo `admin` y `gerente`

En `registrarMantenimientoUnidad`:

- `lecturaServicio >= 0`
- `fechaServicio` requerida
- `tipoControl` válida
- solo `admin` y `gerente`

### 7.2 Permisos

No reutilizar `requireManageRole()` porque hoy incluye `encargado_obra`.

Crear guard nueva:

```ts
export async function requireMaintenanceManager() {
  return requireRole(["admin", "gerente"]);
}
```

---

## 8. Integración con catálogo

### 8.1 Tabla de unidades

Archivo:

- `src/components/catalogo/UnidadesTable.tsx`

Cambios:

- enriquecer `getUnidadesConStats()` para incluir resumen de mantenimiento
- agregar columna/badge `Mantenimiento`

Comportamiento visual:

- `sin_config`
- `ok`
- `proximo km`
- `proximo hrs`
- `vencido km`
- `vencido hrs`
- `vencido km + hrs`

La tabla debe mostrar solo resumen corto, no detalle completo.

### 8.2 Datos de catálogo

Archivo:

- `src/app/actions/catalogo.ts`

Ampliar `getUnidadesConStats()` para devolver:

- `mantenimientoResumen`
- `mantenimientoEstadoGlobal`

---

## 9. Integración con detalle de unidad

Archivos:

- `src/app/(dashboard)/catalogo/unidades/[id]/page.tsx`
- `src/components/catalogo/CatalogoDetalleClient.tsx`

### 9.1 Nueva pestaña

Agregar tab:

- `mantenimiento`

### 9.2 Contenido de la pestaña

Bloques:

- `Plan KM`
- `Plan HRS`

Cada bloque debe mostrar:

- activo/inactivo
- intervalo
- umbral de alerta
- fecha último servicio
- lectura de último servicio
- lectura actual
- próximo servicio en
- faltante
- estado
- inconsistencia si aplica

### 9.3 Acciones UI

Para `admin` y `gerente`:

- editar/guardar plan
- activar/desactivar plan
- registrar mantenimiento

### 9.4 Historial

Tabla de eventos:

- fecha
- tipo control
- lectura de servicio
- descripción
- notas
- usuario que registró

---

## 10. Integración con dashboard

Archivos:

- `src/app/actions/overview.ts`
- `src/components/dashboard/AlertasPanel.tsx`

### 10.1 Nuevo payload en overview

Agregar:

- `alertasMantenimiento`

Forma sugerida:

```ts
type AlertaMantenimiento = {
  unidadId: number;
  unidadCodigo: string;
  tipoControl: "km" | "hrs";
  estado: "proximo" | "vencido";
  lecturaActual: number;
  lecturaServicio: number;
  proximoServicioEn: number;
  faltante: number;
};
```

### 10.2 Render en AlertasPanel

Mostrar solo:

- `proximo`
- `vencido`

No mostrar `ok` ni `sin_config` en dashboard para no contaminar la superficie principal.

Orden:

- primero vencidos
- luego próximos

Texto ejemplo:

- `NISSAN — mantenimiento km próximo · faltan 320 km`
- `EX01 — mantenimiento hrs vencido · excedido por 14 hrs`

---

## 11. Estrategia visual

### 11.1 Badge por estado

- `sin_config` -> gris
- `ok` -> verde
- `proximo` -> ámbar
- `vencido` -> rojo

### 11.2 Regla de UX

- catálogo: sí mostrar `sin_config`
- dashboard: no mostrar `sin_config`, solo alertas accionables
- detalle de unidad: mostrar todo

---

## 12. Plan de implementación

### Fase A — Esquema

1. agregar tablas nuevas en `src/db/schema.ts`
2. agregar relaciones Drizzle
3. generar/push de esquema con cuidado

### Fase B — Dominio

1. crear `src/app/actions/mantenimiento.ts`
2. centralizar cálculo de planes y estado global
3. crear guard `requireMaintenanceManager`

### Fase C — Catálogo

1. enriquecer `getUnidadesConStats()`
2. agregar badge de mantenimiento en `UnidadesTable`

### Fase D — Detalle de unidad

1. agregar nueva pestaña `mantenimiento`
2. crear UI de configuración para `km` y `hrs`
3. crear formulario/modal de registro de mantenimiento
4. agregar historial

### Fase E — Dashboard

1. extender `getOverviewStats()`
2. integrar `alertasMantenimiento`
3. render en `AlertasPanel`

### Fase F — Verificación manual

Casos mínimos:

- unidad sin configuración
- unidad con plan `km`
- unidad con plan `hrs`
- unidad con ambos planes
- alerta próxima
- alerta vencida
- lectura actual menor que lectura base
- permisos `admin`
- permisos `gerente`
- usuario sin permisos de edición

---

## 13. Riesgos

### 13.1 Calidad de lecturas

Si `odometroActual` no se captura correctamente en operación, las alertas también serán incorrectas.

### 13.2 Resets futuros

Si F4 se implementa después, debe coexistir con F6 sin asumir continuidad infinita del odómetro.

### 13.3 Unidades sin uso reciente

Si la lectura no cambia por mucho tiempo, el sistema no puede inferir servicio vencido por tiempo, solo por lectura.

Esto es correcto porque el alcance aprobado es por `km/hrs`, no por calendario.

---

## 14. Decisiones explícitas para implementación

- La lectura actual primaria será `unidades.odometroActual`
- Una unidad puede tener hasta 2 planes activos: uno `km` y uno `hrs`
- El dashboard muestra solo `proximo` y `vencido`
- El catálogo muestra también `sin_config`
- El historial de servicios es obligatorio en modelo de datos
- Los permisos de edición son exclusivos para `admin` y `gerente`

---

## 15. Criterio de “done”

F6 estará terminada cuando:

- se pueda configurar plan por `km` y/o `hrs` por unidad
- se pueda registrar mantenimiento con historial
- el catálogo muestre estado resumido
- el detalle de unidad muestre configuración, estado e historial
- el dashboard muestre alertas próximas/vencidas
- los cálculos no se mezclen entre tipos ni entre unidades
- solo `admin` y `gerente` puedan editar

