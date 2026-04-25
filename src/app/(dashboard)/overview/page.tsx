import { currentUser } from "@clerk/nextjs/server";
import { requirePermission } from "@/lib/server-guard";
import Link from "next/link";
import { PlusCircle, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOverviewStats } from "@/app/actions/overview";
import { getOrCreatePeriodoActual } from "@/app/actions/periodos";
import StockCards from "@/components/dashboard/StockCards";
import CargasRecientes from "@/components/dashboard/CargasRecientes";
import AlertasPanel from "@/components/dashboard/AlertasPanel";
import DashboardKpis from "@/components/dashboard/DashboardKpis";
import { UMBRAL_TALLER, UMBRAL_NISSAN } from "@/lib/alertas-config";

function formatPeriodo(fechaInicio: string, fechaFin: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const ini = new Date(fechaInicio + "T12:00:00").toLocaleDateString(
    "es-MX",
    opts
  );
  const fin = new Date(fechaFin + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${ini} – ${fin}`;
}

export default async function OverviewPage() {
  await requirePermission("dashboard");

  const [user, stats, periodo] = await Promise.all([
    currentUser(),
    getOverviewStats(),
    getOrCreatePeriodoActual(),
  ]);

  const greeting = user?.firstName
    ? `Bienvenido, ${user.firstName}.`
    : "Bienvenido.";

  const alertas =
    (stats.taller.litros < UMBRAL_TALLER ? 1 : 0) +
    (stats.nissan.litros < UMBRAL_NISSAN ? 1 : 0) +
    (stats.alertasRendimiento.length > 0 ? 1 : 0) +
    stats.anomaliasActivas.length;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--fg-muted)" }}
          >
            Dashboard
          </p>
          <h1
            className="font-outfit font-bold text-3xl"
            style={{ color: "var(--fg)" }}
          >
            {greeting}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="secondary" className="text-xs">
              {formatPeriodo(periodo.fechaInicio, periodo.fechaFin)}
            </Badge>
            {alertas > 0 && (
              <Badge variant="danger" className="text-xs">
                {alertas} alerta{alertas > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="secondary" size="sm">
            <Link href="/cargas/campo">
              <Fuel className="w-4 h-4" /> Campo
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/cargas/nueva">
              <PlusCircle className="w-4 h-4" /> Patio
            </Link>
          </Button>
        </div>
      </div>

      {/* Stock cards — real-time via Pusher */}
      <div className="mb-6">
        <StockCards
          initialTaller={stats.taller}
          initialNissan={stats.nissan}
        />
      </div>

      {/* Alertas proactivas */}
      <AlertasPanel
        taller={stats.taller}
        nissan={stats.nissan}
        alertasRendimiento={stats.alertasRendimiento}
        anomaliasActivas={stats.anomaliasActivas}
        ultimoPeriodoCerrado={stats.ultimoPeriodoCerrado}
        periodoActivoId={stats.periodoActivoId}
      />

      {/* KPI del día — real-time via Pusher */}
      <DashboardKpis
        initialCargasHoy={stats.cargasHoy}
        initialLitrosHoy={stats.litrosHoy}
        initialUnidadesActivas={
          stats.recientes.length > 0
            ? new Set(stats.recientes.map((c) => c.unidadId ?? 0)).size
            : 0
        }
      />

      {/* Feed de cargas recientes — real-time via Pusher */}
      <CargasRecientes initialCargas={stats.recientes} />
    </div>
  );
}
