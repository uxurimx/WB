import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be a Neon connection string');
}

// Retry en errores transitorios de Neon (HTTP 500 "Control plane request failed")
// neon:retryable: true en la respuesta indica que es seguro reintentar
neonConfig.fetchFunction = async (url: string, init: RequestInit) => {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status < 500 || attempt >= 2) return res;
    } catch (err) {
      if (attempt >= 2) throw err;
    }
    await new Promise<void>((r) => setTimeout(r, 150 * (attempt + 1)));
  }
};

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Cliente dedicado para poxelbit — siempre apunta a producción (POXELBIT_DATABASE_URL)
// En dev: apunta a la DB de prod para que tickets y novedades sean compartidos con el cliente
// En prod: misma URL que DATABASE_URL
const poxelbitUrl = (process.env.POXELBIT_DATABASE_URL ?? process.env.DATABASE_URL).replace(/\s/g, "");
const sqlPB = neon(poxelbitUrl);
export const dbPB = drizzle(sqlPB, { schema });
