import { currentUser } from "@clerk/nextjs/server";
import { requirePermission } from "@/lib/server-guard";
import { Badge } from "@/components/ui/badge";
import { getOverviewStats } from "@/app/actions/overview";
import { getOrCreatePeriodoActual } from "@/app/actions/periodos";
import StockCards from "@/components/dashboard/StockCards";
import CargasRecientes from "@/components/dashboard/CargasRecientes";
import AlertasPanel from "@/components/dashboard/AlertasPanel";
import DashboardKpis from "@/components/dashboard/DashboardKpis";
import OperacionPanel from "@/components/dashboard/OperacionPanel";
import DashboardQuickCapture from "@/components/dashboard/DashboardQuickCapture";
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
  const greetingMobile = user?.firstName
    ? `Hola, ${user.firstName}.`
    : "Hola.";

  const alertas =
    (stats.taller.litros < UMBRAL_TALLER ? 1 : 0) +
    (stats.nissan.litros < UMBRAL_NISSAN ? 1 : 0) +
    (stats.alertasRendimiento.length > 0 ? 1 : 0) +
    stats.alertasMantenimiento.length +
    stats.anomaliasActivas.length +
    stats.conciliacion.filter((c) => !c.ok).length;

  return (
    <div className="p-4 md:p-8 max-w-[1536px] flex flex-col pb-24 lg:pb-8">
      {/* Header */}
      <div className="order-1 mb-4 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 md:gap-4">
        <div>
          <p
            className="hidden md:block text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--fg-muted)" }}
          >
            Dashboard
          </p>
          <h1
            className="font-outfit font-bold text-xl md:text-3xl"
            style={{ color: "var(--fg)" }}
          >
            <span className="md:hidden">{greetingMobile}</span>
            <span className="hidden md:inline">{greeting}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="secondary" className="text-xs">
              {formatPeriodo(periodo.fechaInicio, periodo.fechaFin)}
            </Badge>
            {alertas > 0 && (
              <a href="#alertas">
                <Badge variant="danger" className="text-xs">
                  {alertas} alerta{alertas > 1 ? "s" : ""}
                </Badge>
              </a>
            )}
          </div>
        </div>

        <DashboardQuickCapture />
      </div>

      {/* Stock cards — real-time via Pusher */}
      <div className="order-2 mb-4 md:mb-6">
        <StockCards
          initialTaller={stats.taller}
          initialNissan={stats.nissan}
        />
      </div>

      <div className="order-5 lg:order-3">
        <OperacionPanel
          operacion={stats.operacion}
          peorRendimiento={stats.alertasRendimiento}
          periodoCerradoId={stats.ultimoPeriodoCerrado?.id ?? null}
        />
      </div>

      {/* Alertas proactivas */}
      <div className="order-4">
        <AlertasPanel
          taller={stats.taller}
          nissan={stats.nissan}
          alertasRendimiento={stats.alertasRendimiento}
          alertasMantenimiento={stats.alertasMantenimiento}
          anomaliasActivas={stats.anomaliasActivas}
          conciliacion={stats.conciliacion}
          ultimoPeriodoCerrado={stats.ultimoPeriodoCerrado}
          periodoActivoId={stats.periodoActivoId}
          ticketsResueltos={stats.ticketsResueltos}
        />
      </div>

      {/* KPI del día — real-time via Pusher */}
      <div className="order-6 lg:order-5">
        <DashboardKpis
          initialCargasHoy={stats.cargasHoy}
          initialLitrosHoy={stats.litrosHoy}
          fechaHoy={stats.hoy}
          initialUnidadesActivas={
            stats.recientes.length > 0
              ? new Set(stats.recientes.map((c) => c.unidadId ?? 0)).size
              : 0
          }
        />
      </div>

      {/* Feed de actividad reciente — real-time via Pusher */}
      <div className="order-3 lg:order-6 mb-4 lg:mb-0">
        <CargasRecientes
          initialCargas={stats.recientes}
          recargasRecientes={stats.recientesRecargas}
          transferenciasRecientes={stats.recientesTransferencias}
        />
      </div>

    </div>
  );
}
