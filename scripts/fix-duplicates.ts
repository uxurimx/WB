import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

const db = drizzle(neon(process.env.DATABASE_URL!));

// Elimina duplicados de cargas (folio, origen), conserva el de menor id
await db.execute(sql`
  DELETE FROM cargas
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY folio, origen ORDER BY id) AS rn
      FROM cargas
      WHERE folio IS NOT NULL
    ) t
    WHERE rn > 1
  )
`);

console.log("Duplicados eliminados. Ahora corre: npm run db:push");
