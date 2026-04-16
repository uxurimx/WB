import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { PlusCircle, Fuel, Wrench, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOverviewStats } from "@/app/actions/overview";
import { getOrCreatePeriodoActual } from "@/app/actions/periodos";
import StockCards from "@/components/dashboard/StockCards";
import CargasRecientes from "@/components/dashboard/CargasRecientes";
import AlertasPanel from "@/components/dashboard/AlertasPanel";
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
    stats.alertasRendimiento.length;

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
              <PlusCircle className="w-4 h-4" /> Nueva Carga
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
        ultimoPeriodo={stats.ultimoPeriodoCerrado}
      />

      {/* KPI del día */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Cargas Hoy",
            value: stats.cargasHoy,
            unit: "eventos",
            icon: Wrench,
            color: "purple",
          },
          {
            label: "Litros Hoy",
            value: `${stats.litrosHoy.toLocaleString()}`,
            unit: "despachados",
            icon: Fuel,
            color: "indigo",
          },
          {
            label: "Período actual",
            value: stats.recientes.length > 0
              ? new Set(stats.recientes.map((c) => c.unidadId ?? 0)).size
              : 0,
            unit: "unidades activas",
            icon: BarChart3,
            color: "emerald",
          },
        ].map(({ label, value, unit, icon: Icon }) => (
          <div
            key={label}
            className="p-4 rounded-2xl border"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--fg-muted)" }}
              >
                {label}
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Icon className="w-3.5 h-3.5 text-indigo-500" />
              </div>
            </div>
            <p
              className="font-outfit font-bold text-3xl"
              style={{ color: "var(--fg)" }}
            >
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {unit}
            </p>
          </div>
        ))}
      </div>

      {/* Feed de cargas recientes — real-time via Pusher */}
      <CargasRecientes initialCargas={stats.recientes} />
    </div>
  );
}
