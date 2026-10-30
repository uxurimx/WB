# Unicidad global de folios internos

La migración `migrations/20261030_global_internal_folio_uniqueness.sql` impide repetir el identificador completo de un folio entre cargas de Patio, Campo o transferencias. El identificador es el código de serie más el número: `BASE 60051` y `A60051` sí pueden coexistir; dos `A60051` no. Los folios de origen `externo` quedan fuera porque pertenecen a proveedores.

Patio y Campo mantienen consecutivos independientes por serie, basados en el último folio registrado en ese carril; las transferencias usan el consecutivo de Patio. Si el folio manual se cambia a un número menor y se guarda, la siguiente sugerencia de ese mismo carril y serie será ese número más uno.

El servidor valida antes de guardar y la migración añade una protección transaccional con bloqueo por número para evitar duplicados por capturas simultáneas. Los folios duplicados que ya existen no se borran ni se reasignan; la migración permite instalarlos y bloquea nuevas inserciones o cambios que creen más duplicados.

## Revisión de duplicados existentes

```sql
SELECT codigo, folio, string_agg(origen, ', ' ORDER BY origen) AS origenes,
       count(*) AS registros
FROM (
  SELECT fs.codigo, c.folio, c.origen
  FROM cargas c JOIN folio_series fs ON fs.id = c.folio_serie_id
  WHERE c.folio IS NOT NULL AND c.origen IN ('patio', 'campo')
  UNION ALL
  SELECT fs.codigo, t.folio, 'transferencia' AS origen
  FROM transferencias_tanque t JOIN folio_series fs ON fs.id = t.folio_serie_id
  WHERE t.folio IS NOT NULL
) movimientos
GROUP BY codigo, folio
HAVING count(*) > 1
ORDER BY codigo, folio;
```

Aplicar manualmente solo después de confirmar la rama de base de datos objetivo. No usar `db:push`. La consulta posterior puede ejecutarse igual: debe devolver exactamente las colisiones históricas que siguen pendientes de conciliación, y no crecer después de la migración.

Para validar, intentar guardar el mismo código de serie y número desde otro origen; debe rechazarse con `FOLIO OCUPADO`. El mismo número con otro código de serie debe aceptarse. Confirmar que Patio y Campo conservan sus propios consecutivos dentro de la serie seleccionada.
