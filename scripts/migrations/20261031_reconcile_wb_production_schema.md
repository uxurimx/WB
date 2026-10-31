# Alinear el esquema de producción WB

Migración preparada el 2026-10-31 tras comparar en solo lectura `ep-still-river…` (pruebas) y `ep-hidden-sun…` (producción), ambas en `neondb`, PostgreSQL 18.6. No se aplicaron cambios a ninguna base.

## Diferencias cubiertas

- Series de folios Patio/Campo/transferencias: tabla, dos series `BASE`, columnas, índices, funciones y triggers de unicidad compartida/global, y ancho `folio_digitos`.
- Taller: `incidencias_taller`, `taller_eventos`, `taller_urea`; columnas faltantes de orden, checklist y refacciones; folio compartido de órdenes/incidencias; índices y claves foráneas.
- Claves foráneas de unidad y plan para mantenimiento, presentes en pruebas.
- `push_subscriptions` existe solo en producción y se conserva intacta.

El archivo SQL detiene la ejecución si encuentra folios duplicados por origen, referencias de mantenimiento huérfanas o un esquema parcialmente migrado. Compara antes y después los conteos y los identificadores de cargas, transferencias, órdenes, checklist y refacciones. También verifica los conteos previstos de objetos: 33 tablas, 342 columnas, 221 constraints, 55 índices, 12 triggers, 31 secuencias y 3 funciones de folios.

## Antes de aplicarla

1. Confirmar que la sesión SQL apunta explícitamente a producción (`ep-hidden-sun…`, `neondb`); no usar el `DATABASE_URL` activo de `.env.local`, que apunta a pruebas.
2. Crear y validar un respaldo reciente de producción.
3. Ejecutar `scripts/migrations/20261031_reconcile_wb_production_schema.sql` con `psql -v ON_ERROR_STOP=1`. El script incluye `BEGIN`/`COMMIT`; cualquier excepción antes del `COMMIT` revierte toda la transacción.
4. Conservar la salida y comparar el catálogo posterior con pruebas. Revisar especialmente las cinco filas de `orden_refacciones` (reciben valores por defecto de `unidad_medida` y `origen`), los 60 checklist (se deriva `respuesta` de `ok`) y las seis órdenes (se asignan folios y categoría).

No ejecutar `20261029_align_wb_production_schema.sql` en este destino: es una migración baseline completa y no corresponde al estado parcial medido aquí.

## Reversión

Antes del `COMMIT`, PostgreSQL revierte todo si falla un guard o postflight. Después del `COMMIT`, no hay rollback automático seguro: varias tablas y campos son aditivos y se asignan folios; recuperar el estado anterior requiere restaurar el respaldo o preparar una reversión específica tras revisar el uso de la aplicación.

## Aplicación y verificación — 2026-10-31

Aplicada en `ep-hidden-sun…/neondb` después de crear el respaldo validado:

- Archivo: `/home/torres/Backups/WB/WBConstruccion-production-ep-hidden-sun-20261031T134559Z.dump`
- SHA-256: `c4e1db443cf9f254a7c19efc66d2f079c565b88719a8fd518f4839c69e5bf8ee`
- Tamaño: 122,696 bytes; dump custom, permisos `0600`; `pg_restore --list` pasó.
- Un primer intento llegó al postflight y se revirtió completo porque el conteo esperado de índices incluía un índice legado (`cargas_folio_origen_unique`) que la migración elimina. Se corrigió el esperado a 55 y el segundo intento terminó en `COMMIT`.

Postflight en solo lectura: producción quedó en 33 tablas, 342 columnas, 221 constraints, 55 índices, 12 triggers, 31 secuencias y 3 funciones. El único delta de catálogo frente a pruebas es `push_subscriptions` (tabla, 6 columnas, 7 constraints, 2 índices y su secuencia), preservada como estaba. Coinciden rutinas, vistas y políticas.

Los conteos operativos quedaron en 755 cargas, 31 transferencias, 6 órdenes, 60 checklist y 5 refacciones; 0 órdenes sin folio, 0 folios duplicados entre órdenes, 0 cargas/transferencias sin serie y 0 respuestas de checklist pendientes cuando había respuesta `ok`. Las 2 series `BASE` están presentes. Las tablas nuevas de incidencias, eventos de Taller y urea están vacías; no se importaron datos de pruebas.
