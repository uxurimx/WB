import { neon, neonConfig } from '@neondatabase/serverless';
import { Pool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured');
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

function isLocalPostgresUrl(url: string): boolean {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const socketPath = parsed.searchParams.get('host');

  return ['localhost', '127.0.0.1', '::1'].includes(hostname) || Boolean(socketPath?.startsWith('/'));
}

type DatabaseGlobals = typeof globalThis & {
  __wbLocalPostgresPools?: Map<string, Pool>;
};

function getLocalPool(url: string): Pool {
  const globalWithPools = globalThis as DatabaseGlobals;
  globalWithPools.__wbLocalPostgresPools ??= new Map();

  const existing = globalWithPools.__wbLocalPostgresPools.get(url);
  if (existing) return existing;

  const pool = new Pool({ connectionString: url });
  globalWithPools.__wbLocalPostgresPools.set(url, pool);
  return pool;
}

function createLocalSql(pool: Pool) {
  return async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0] ?? '';
    for (let index = 0; index < values.length; index++) {
      text += `$${index + 1}${strings[index + 1] ?? ''}`;
    }

    const result = await pool.query(text, values);
    return result.rows;
  };
}

function createDatabase(url: string) {
  if (isLocalPostgresUrl(url)) {
    const pool = getLocalPool(url);
    return {
      db: drizzlePostgres(pool, { schema }),
      sql: createLocalSql(pool),
    };
  }

  const client = neon(url);
  return {
    db: drizzleNeon(client, { schema }),
    sql: client,
  };
}

// Mantiene la forma de tipos del cliente Neon para el resto de la aplicación;
// ambos drivers implementan la misma API Drizzle usada por este proyecto.
const neonTypeClient = neon(databaseUrl);
const neonTypeDatabase = drizzleNeon(neonTypeClient, { schema });
const mainDatabase = createDatabase(databaseUrl);

export const neonSql = mainDatabase.sql as typeof neonTypeClient;
export const db = mainDatabase.db as typeof neonTypeDatabase;

// Cliente dedicado para poxelbit. En producción usa POXELBIT_DATABASE_URL;
// las pruebas locales pueden apuntar ambos clientes al respaldo restaurado.
const poxelbitUrl = (process.env.POXELBIT_DATABASE_URL ?? databaseUrl).replace(/\s/g, '');
const poxelbitDatabase = createDatabase(poxelbitUrl);
export const dbPB = poxelbitDatabase.db as typeof neonTypeDatabase;
