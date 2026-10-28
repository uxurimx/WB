# Estado de Max en WB

Última actualización: 2026-10-23.

- Rama original del agente: `dev_agent`; el portal también se habilita en `feat/bitacora-taller` para el desarrollo de Bitácora.
- Se está conectando el panel interno PoxelBit a Codex app-server local.
- El acceso web está restringido a una identidad Clerk concreta: correo principal `poxelbit@gmail.com` y verificado; el chequeo debe existir en menú, página y todas las APIs del agente.
- Conversaciones de prueba persistidas localmente en `.poxelbit/dev-agent/threads`; no usan Neon.
- La ejecución de Codex es local; `--dangerously-bypass-approvals-and-sandbox` se permite solo con la opción de prueba local y nunca en producción.
- El chat permite adjuntar imágenes/documentos y pegar imágenes del portapapeles; temporales con límites y limpieza al terminar.
- El contexto técnico cubre rutas, áreas, acciones y entidades de datos principales; se inyecta al crear y reanudar conversaciones.
- ESLint dirigido a los archivos del portal/agente: 0 errores y 1 advertencia existente por `<img>` en `SideNav.tsx`.
- TypeScript no reporta errores en los archivos del agente; siguen dos errores preexistentes de tipo `never` en `CatalogoDetalleClient.tsx` y `CatalogoDetalleModal.tsx`.
- No se inició el servidor local ni Codex app-server; queda pendiente la verificación interactiva del inicio de sesión autorizado, streaming, edición y pegado de capturas.
- No desplegar, publicar, cambiar de rama, hacer commit/push ni modificar bases de datos sin autorización explícita.

Al cerrar una tarea de desarrollo, actualizar este archivo con el estado verificado y pendientes concretos.
