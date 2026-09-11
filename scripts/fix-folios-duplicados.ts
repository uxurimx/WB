/**
 * Reasigna folios duplicados en cargas (mismo folio + mismo origen).
 * Conserva el folio original en la fila más antigua (menor id).
 * Patio comparte secuencia con transferencias → usa max(patio, transferencias)+1.
 *
 * Uso: npx tsx scripts/fix-folios-duplicados.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

type Dup = {
  folio: number;
  origen: string;
  ids: number[];
};

async function main() {
  const dups = (await sql`
    SELECT folio, origen, array_agg(id ORDER BY id) AS ids
    FROM cargas
    WHERE folio IS NOT NULL
    GROUP BY folio, origen
    HAVING count(*) > 1
    ORDER BY origen, folio
  `) as Dup[];

  if (dups.length === 0) {
    console.log("No hay duplicados (folio, origen).");
  } else {
    const [maxPatioRow] = await sql`
      SELECT GREATEST(
        COALESCE((SELECT max(folio) FROM cargas WHERE origen = 'patio' AND folio <= 99999), 0),
        COALESCE((SELECT max(folio) FROM transferencias_tanque WHERE folio <= 99999), 0)
      ) AS n
    `;
    const [maxCampoRow] = await sql`
      SELECT COALESCE(max(folio), 0) AS n
      FROM cargas WHERE origen = 'campo' AND folio <= 99999
    `;
    let nextPatio = Number(maxPatioRow.n) + 1;
    let nextCampo = Number(maxCampoRow.n) + 1;

    const remaps: { id: number; origen: string; de: number; a: number }[] = [];
    for (const g of dups) {
      const [keep, ...rest] = g.ids;
      console.log(`Conservar ${g.origen} folio ${g.folio} en id=${keep}; reasignar ids=${rest.join(",")}`);
      for (const id of rest) {
        const nuevo = g.origen === "patio" ? nextPatio++ : nextCampo++;
        remaps.push({ id, origen: g.origen, de: Number(g.folio), a: nuevo });
      }
    }

    const queries = remaps.flatMap((r) => [
      sql`
        UPDATE cargas
        SET
          folio = ${r.a},
          notas = trim(both FROM coalesce(notas, '') || ${` [folio original ${r.de} reasignado por duplicado]`})
        WHERE id = ${r.id}
      `,
      sql`
        INSERT INTO audit_log (usuario_id, accion, entidad, entidad_id, datos_json)
        VALUES (
          'system',
          'reasignar_folio',
          'carga',
          ${String(r.id)},
          ${JSON.stringify(r)}
        )
      `,
    ]);

    await sql.transaction(queries);
    console.log("Reasignados:", remaps);
  }

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS cargas_folio_origen_unique
    ON cargas (folio, origen)
    WHERE folio IS NOT NULL
  `;
  console.log("Índice único cargas_folio_origen_unique creado.");

  const leftover = await sql`
    SELECT folio, origen, count(*)::int AS n
    FROM cargas
    WHERE folio IS NOT NULL
    GROUP BY folio, origen
    HAVING count(*) > 1
  `;
  console.log("Duplicados restantes:", leftover);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
