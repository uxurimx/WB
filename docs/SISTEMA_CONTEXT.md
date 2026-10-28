# Contexto técnico del sistema WB

Documento de referencia del agente Max. Describe la arquitectura observada en el repositorio y las decisiones de operación vigentes para la rama de pruebas `dev_agent`. Los cambios de infraestructura o de datos requieren autorización independiente.

## Propósito y stack

WB es una aplicación web de control de inventario de diésel y desempeño de flota. Usa Next.js 16 con App Router, React 19 y TypeScript. Las páginas autenticadas viven bajo `src/app/(dashboard)`, las mutaciones y reglas de negocio en `src/app/actions`, los endpoints en `src/app/api`, la interfaz en `src/components`, los modelos Drizzle en `src/db/schema.ts` y utilidades compartidas en `src/lib`.

Dependencias de infraestructura que aparecen en el código: Clerk para identidad, Neon/PostgreSQL mediante `@neondatabase/serverless` y Drizzle, Pusher para tiempo real, UploadThing para archivos y Vercel como configuración de despliegue. No asumir que un servicio externo o una rama de base está disponible solo porque exista una variable de entorno.

## Áreas funcionales

- **Overview:** indicadores operativos, alertas y capturas rápidas.
- **Cargas y tanques:** entradas de combustible, patio/campo, traspasos y conciliación de existencias.
- **Catálogos:** unidades, operadores y obras; el detalle de unidades integra información operativa y mantenimiento.
- **Análisis:** historial, períodos, rendimiento e informes.
- **Sistema:** administración de usuarios/roles, importaciones y configuración.
- **PoxelBit cliente:** `/poxelbit`, `/poxelbit/tickets`, `/poxelbit/novedades` y detalle de módulos/tickets. Sigue propuestas, estados de módulos, solicitudes y comunicación con el cliente. Mantiene permisos propios y no se modifica al limitar el portal interno de desarrollo.
- **PoxelBit Agente Dev:** `/poxelbit/dev`, área interna de trabajo de Max. El único usuario autorizado es la cuenta Clerk con correo principal verificado `poxelbit@gmail.com`. La misma regla se valida en el menú, la página y cada endpoint; no conceder acceso solo por el rol general `admin`.

## Rutas y entidades principales

- **Panel y operación:** `/overview`, `/cargas`, `/cargas/nueva`, `/cargas/campo` y `/tanques` cubren el resumen, historial/captura de cargas y consulta de tanques.
- **Catálogos:** `/catalogo/unidades`, `/catalogo/unidades/[id]`, `/catalogo/operadores`, `/catalogo/operadores/[id]`, `/catalogo/obras` y `/catalogo/obras/[id]`.
- **Análisis:** `/periodos`, `/periodos/[id]` y `/analiticas`.
- **Administración:** `/admin`, `/admin/importar` y `/settings`.
- **Portal de cliente:** `/poxelbit`, `/poxelbit/tickets`, `/poxelbit/tickets/[id]`, `/poxelbit/modulos/[id]` y `/poxelbit/novedades`.
- **Agente interno:** `/poxelbit/dev`; API bajo `/api/poxelbit/dev-agent/*`.

Las tablas de dominio en `src/db/schema.ts` incluyen usuarios, roles, unidades, operadores, obras, planes y eventos de mantenimiento, resets de odómetro, series de folios, fuentes y tanques de diésel, períodos, cargas, recargas y transferencias de tanque, rendimientos, archivos, configuración y auditoría. El área PoxelBit agrega módulos, tickets, mensajes y novedades; también hay tablas de suscripciones push y analítica. Consultar el esquema antes de proponer cambios: nombres y relaciones no sustituyen la revisión de invariantes de negocio.

Las acciones de servidor están agrupadas por dominio en `src/app/actions`: cargas, tanques, folios, períodos, catálogos, mantenimiento, rendimientos, importación, archivos, administración, configuración inicial, resumen, PoxelBit y notificaciones push. Mantener las mutaciones y sus guardas en estas acciones; no duplicar reglas en componentes cliente.

## Identidad y autorización

Clerk autentica usuarios y almacena el rol en `publicMetadata.role`. Las rutas privadas comprueban identidad y permiso en el servidor. `src/lib/permissions.ts` define el mapa de navegación; esconder un enlace no sustituye la autorización de página o API.

El usuario `admin` tiene amplias facultades en el sistema. `gerente` ve PoxelBit cliente, pero no equivale a autorización para ejecutar el agente. El acceso a Agente Dev se decide por correo principal verificado, no por esos roles.

## Datos y límites de operación

- La base principal se configura con `DATABASE_URL` y contiene la operación WB.
- `dbPB` en `src/db/index.ts` puede usar `POXELBIT_DATABASE_URL` y, por defecto, comparte la base del portal PoxelBit. **No usar `db:push`, migraciones, seeds, resets ni consultas de escritura sin confirmar antes el destino de `DATABASE_URL` y la autorización.** Hay folios históricos duplicados; cambios de inventario/folios requieren revisar invariantes y rollback.
- El agente guarda sus conversaciones de pruebas en archivos privados bajo `.poxelbit/dev-agent/threads`, ignorados por Git. No escribir sesiones en la base compartida con clientes.
- Los dumps y respaldos operativos no son contexto automático del agente. No abrir, copiar, mostrar, adjuntar ni versionar secretos, `.env*`, SQL/Excel de respaldo, `.git` o `.poxelbit`.

## Agente local

`src/lib/poxelbit-dev-agent.ts` mantiene un proceso Codex `app-server` por stdio. La instancia local de Next debe correr en `NODE_ENV=development`, desde la raíz del repositorio y sobre `dev_agent` o `feat/bitacora-taller`; el agente no se ejecuta en Vercel/serverless porque necesita un proceso persistente con acceso al checkout.

En la prueba local, `POXELBIT_DEV_AGENT_DANGER=true` arranca Codex con `--dangerously-bypass-approvals-and-sandbox`, lo que elimina sandbox y aprobaciones. Solo usar en este host de pruebas y a petición del usuario. En producción el agente permanece desactivado. Antes de alojar el portal remotamente se necesitará un runner persistente aislado y un canal autenticado; no abrir el proceso app-server directamente a la red.

El perfil, memoria, estado y este documento se cargan como instrucciones de desarrollo en cada creación y reanudación de conversación. El perfil se llama Max y habla en español. Las actualizaciones de memoria deben ser breves, factuales y sin secretos.

## Adjuntos

El chat acepta capturas/imágenes y documentos de referencia. El navegador valida cantidad y tamaño para orientar al usuario; el servidor vuelve a validar nombre, extensión, datos, cantidad y límites antes de escribir archivos temporales con permisos restringidos. Elimina esos temporales al terminar incluso si Codex falla. Las imágenes se envían como imágenes locales a app-server; los documentos se ofrecen como archivos de contexto que Max puede leer, no modificar.

## Desarrollo y mantenimiento

Comandos documentados en `package.json`:

- `npm run dev`: servidor local Next/Webpack.
- `npm run build`: compilación de producción.
- `npm run lint`: ESLint.
- `npx tsc --noEmit --incremental false`: revisión limpia de TypeScript.
- `npm run db:push`: **operación de base de datos de riesgo**, no ejecutarla sin verificar destino y autorización.

Convenciones: TypeScript, dos espacios, comillas dobles, punto y coma; Server Components por defecto; mutaciones del lado servidor, autorización explícita y revalidación de rutas. No crear ni ejecutar pruebas salvo petición del usuario. Para flujos de folios, stock y períodos, documentar verificación manual si el usuario solicita validar.

Antes de una tarea, revisar estado de Git y conservar cambios preexistentes. Trabajar en la rama activa autorizada (`dev_agent` o `feat/bitacora-taller`); no cambiar de rama, hacer commit, push, publicar o desplegar sin instrucción explícita. Al informar el cierre, distinguir cambios, comprobaciones realizadas y pendientes.
