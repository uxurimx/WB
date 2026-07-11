import { requirePermission } from "@/lib/server-guard";
import { getTanquesDetalle } from "@/app/actions/tanques";
import TanquesClient from "@/components/tanques/TanquesClient";

export default async function TanquesPage() {
  await requirePermission("tanques");
  const tanques = await getTanquesDetalle();

  return <TanquesClient tanques={tanques} />;
}
