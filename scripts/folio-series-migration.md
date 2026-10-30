# Series de folios: despliegue

La aplicación espera el esquema creado por `folio-series.sql`. No usar `drizzle-kit push` en la rama de producción: el historial de folios requiere preflight y la migración conserva las filas existentes bajo la serie `BASE`.

Para habilitar la configuración compartida nueva, aplicar después `migrations/20261030_shared_folio_series.sql` siguiendo [shared-folio-series-migration.md](shared-folio-series-migration.md). La migración base sigue describiendo la instalación histórica; no reemplaza ese segundo paso.

## Antes de aplicar

Confirmar que `DATABASE_URL` apunta a la rama Neon objetivo y ejecutar estas consultas en modo lectura:

```sql
SELECT folio, origen, count(*)
FROM cargas
WHERE folio IS NOT NULL
GROUP BY folio, origen
HAVING count(*) > 1;

SELECT folio, count(*)
FROM transferencias_tanque
WHERE folio IS NOT NULL
GROUP BY folio
HAVING count(*) > 1;

SELECT c.id AS carga_id, t.id AS transferencia_id, c.folio
FROM cargas c
JOIN transferencias_tanque t ON t.folio = c.folio
WHERE c.origen = 'patio' AND c.folio IS NOT NULL;
```

La primera y segunda consulta deben regresar cero filas. Las coincidencias de la tercera son referencias históricas separadas por su tipo de movimiento y origen; se conservan. En producción aparecen cuatro coincidencias históricas de este tipo.

Las cargas `externo` no pertenecen a bloques Patio/Campo. Sus folios de proveedor se conservan sin serie; la migración solo asigna `BASE` a cargas Patio/Campo y permite que `folio_serie_id` sea nulo para origen externo.

## Aplicación y comprobación

Aplicar manualmente `folio-series.sql` una vez, en una sesión SQL sobre la rama confirmada. El script crea una serie `BASE` para Patio y otra para Campo, conserva los rangos y bases existentes, asigna las cargas Patio/Campo y transferencias actuales, deja los folios externos sin serie y añade índices únicos por serie. Un trigger asigna la serie predeterminada a inserciones del código anterior que aún no envía `folio_serie_id`.

Después, las consultas de duplicados por serie y de cargas Patio/Campo sin serie incluidas al final de `folio-series.sql` deben regresar cero filas. La consulta de coincidencias Patio/transferencias puede seguir mostrando las cuatro referencias históricas separadas por sus prefijos. Revisar Configuración → Folios, crear el nuevo bloque, comprobar que queda predeterminado y validar en una instancia de prueba que el mismo número se acepta en dos series distintas, pero se rechaza dos veces dentro de la misma.

## Reversión

No borrar las columnas ni la tabla después de registrar folios de bloques que se repiten: se perdería la distinción que permite identificar los tickets. Una reversión de código solo es segura antes de capturar con más de una serie por origen. Si eso ya ocurrió, primero exportar y conciliar los folios por bloque; no colapsar la serie a números solos.
