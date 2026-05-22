import { requirePermission } from "@/lib/server-guard";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export default async function AnaliticasPage() {
  await requirePermission("analiticas");
  return <AnalyticsDashboard />;
}
