import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { roles } from "../src/db/schema";
import { ROLE_NAV_PERMISSIONS } from "../src/lib/permissions";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  for (const [id, permisos] of Object.entries(ROLE_NAV_PERMISSIONS)) {
    await db
      .insert(roles)
      .values({ id, label: id, permisos: JSON.stringify(permisos) })
      .onConflictDoUpdate({ target: roles.id, set: { permisos: JSON.stringify(permisos) } });
    console.log(`✓ ${id}:`, permisos.join(", "));
  }
  console.log("Listo.");
}

main().catch(console.error);
