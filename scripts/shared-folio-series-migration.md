# Series compartidas de folios

La migración `migrations/20261030_shared_folio_series.sql` habilita series comunes entre Patio, Campo y transferencias. Las series antiguas ligadas a Patio o Campo quedan intactas para consultar el historial. Al crear la primera serie compartida desde Configuración, esta pasa a ser la serie predeterminada de las nuevas capturas y las series antiguas dejan de aparecer en sus selectores.

El folio visible combina código de serie y número, por ejemplo `A10001`. El código `BASE` se oculta al mostrar folios históricos. Patio, Campo y transferencias no pueden repetir el identificador completo dentro de una serie, pero un mismo número sí puede usarse con otra serie (por ejemplo, `BASE 60051` y `A60051`). La regla se instala con `migrations/20261030_global_internal_folio_uniqueness.sql`.

El ancho del número se configura escribiendo los límites como texto. `00001` a `99999` conserva cinco dígitos en captura, historial y reportes; `0` a `0` no añade ceros y sugiere del 1 al 99999. El ancho se guarda en `folio_digitos` mediante `migrations/20261030_folio_series_padding.sql`.

## Preflight

Confirmar la rama de base de datos objetivo y que ya están aplicadas las migraciones de series existentes. Revisar duplicados dentro de cada serie:

```sql
SELECT folio_serie_id, folio, count(*)
FROM cargas
WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL
GROUP BY folio_serie_id, folio
HAVING count(*) > 1;

SELECT c.id AS carga_id, t.id AS transferencia_id, c.folio, c.folio_serie_id
FROM cargas c
JOIN transferencias_tanque t
  ON t.folio_serie_id = c.folio_serie_id AND t.folio = c.folio
JOIN folio_series fs ON fs.id = c.folio_serie_id AND fs.origen = 'compartida'
WHERE c.folio IS NOT NULL;
```

Ambas consultas deben devolver cero filas. Las coincidencias históricas Patio/transferencias pertenecen a series antiguas y se conservan; no se consideran duplicados de una serie compartida.

Aplicar el archivo SQL manualmente en una sesión transaccional. No usar `db:push` ni ejecutar la migración contra una rama no confirmada. La migración agrega unicidad `serie + número` entre cargas y un trigger transaccional que coordina cargas con transferencias para evitar duplicados entre ambas tablas, incluso ante capturas concurrentes.

## Comprobación posterior

```sql
SELECT folio_serie_id, folio, count(*)
FROM cargas
WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL
GROUP BY folio_serie_id, folio
HAVING count(*) > 1;

SELECT c.id AS carga_id, t.id AS transferencia_id, c.folio, c.folio_serie_id
FROM cargas c
JOIN transferencias_tanque t
  ON t.folio_serie_id = c.folio_serie_id AND t.folio = c.folio
JOIN folio_series fs ON fs.id = c.folio_serie_id AND fs.origen = 'compartida'
WHERE c.folio IS NOT NULL;
```

Verificar además en una instancia controlada que la misma serie y número no se aceptan dos veces, aunque se intente desde orígenes distintos; que ese número sí se acepta al usar otra serie; y que el origen Patio/Campo continúa visible por separado. No crear ni activar una letra de serie en la base real hasta que el usuario haya definido cuál corresponde al bloque físico actual.

## Reversión

No revertir después de guardar cargas con series compartidas. Esos registros dependen de esa identidad para distinguir folios repetidos entre bloques. Antes de cualquier reversión posterior, exportar y conciliar todos los movimientos por serie; no reasignar a `BASE` ni colapsar el identificador a su número.
