# Agente interno de desarrollo

El panel de prueba está en **PoxelBit → Agente Dev**. Solo lo ve y puede usar la cuenta Clerk cuyo correo principal verificado es `poxelbit@gmail.com`. La regla se aplica al menú, la página y cada endpoint. Portal, Tickets y Novedades mantienen sus permisos actuales.

## Registro de implementación — 2026-10-23

- Se agregó `/poxelbit/dev` con historial local, vista del estado de archivos del checkout y chat en streaming conectado a Codex `app-server` por stdio.
- Se definió a Max como responsable de desarrollo/mantenimiento. El perfil, la memoria, el estado, las instrucciones del repositorio y el contexto técnico se cargan al crear y al reanudar conversaciones.
- Se aplicó una autorización por correo principal Clerk verificado en el menú, la página y todos los endpoints del agente; no depende del rol `admin` ni cambia el acceso al portal cliente.
- Se incorporó soporte para imágenes y documentos adjuntos, incluido pegar capturas con `Ctrl+V`. El servidor vuelve a validar tipos/tamaños y limpia los temporales al finalizar cada turno.
- Las conversaciones se guardan localmente bajo `.poxelbit/dev-agent/threads/`; la función requiere Next.js local y no se ejecuta en Vercel/serverless.
- Validación de esta entrega: ESLint dirigido a los archivos del portal, 0 errores y 1 advertencia existente por el `<img>` de `SideNav`. TypeScript no reporta errores del agente, pero el chequeo global sigue detenido por dos errores preexistentes (`CatalogoDetalleClient.tsx` y `CatalogoDetalleModal.tsx`). No se hizo prueba interactiva ni se inició Codex app-server.

## Activación local

Agrega estas opciones a `.env.local` de la máquina que ejecutará Next.js:

```dotenv
POXELBIT_DEV_AGENT_ENABLED=true
POXELBIT_DEV_AGENT_DANGER=true
```

Reinicia `npm run dev`. Codex CLI debe estar instalado e iniciado para el mismo usuario del sistema que ejecuta Next. Si el ejecutable no está en `PATH`, define `POXELBIT_DEV_AGENT_CODEX_BIN` con su ruta absoluta. Next debe iniciarse desde la raíz del repositorio; el agente comprueba que la rama activa sea `dev_agent`.

`POXELBIT_DEV_AGENT_DANGER=true` usa `--dangerously-bypass-approvals-and-sandbox`, con acceso completo al usuario del servidor y sin pedir confirmación por comando. Úsalo únicamente en la máquina de pruebas y con cuentas staff autorizadas. No habilites esta opción en una instancia publicada o accesible desde Internet. Para trabajar sin ese bypass, deja el valor en `false`; Codex usará el sandbox `workspace-write`.

## Datos y límites actuales

- Las conversaciones se guardan en `.poxelbit/dev-agent/threads/`, fuera de Git, con permisos locales restringidos. La lista es compartida por el proceso de desarrollo de esta máquina.
- Max recibe `AGENTS.md`, `docs/SISTEMA_CONTEXT.md` y `.agents/max/{role,memory,state}.md` al crear una conversación y cada vez que una existente se reanuda.
- El agente solo se inicia desde rutas Node locales de Next.js. **No funciona en Vercel/serverless**, porque ahí no existe un proceso persistente con acceso al checkout local. La producción responde como desactivada.
- Esta primera versión no toca Neon ni las tablas PoxelBit, y trabaja directamente sobre el checkout `dev_agent`.
- El chat permite texto, imágenes pegadas desde el portapapeles, imágenes y documentos seleccionados desde el botón. Admite hasta 5 adjuntos, 8 MB cada uno y 16 MB en total; los temporales se eliminan al terminar el turno.
- Los datos del agente son locales a una máquina; no se sincronizan entre varias instancias.

Antes de convertir esto en una herramienta compartida o desplegada, hace falta un runner persistente aislado que tenga el repositorio y reciba solicitudes autenticadas del panel. También hay que decidir cómo el staff revisará y aplicará los diffs antes de incorporarlos al checkout principal.
