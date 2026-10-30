import { currentUser } from "@clerk/nextjs/server";
import { requirePermission } from "@/lib/server-guard";
import { Badge } from "@/components/ui/badge";
import { getOverviewStats } from "@/app/actions/overview";
import { getOrCreatePeriodoActual } from "@/app/actions/periodos";
import StockCards from "@/components/dashboard/StockCards";
import AlertasPanel from "@/components/dashboard/AlertasPanel";
import DashboardQuickCapture from "@/components/dashboard/DashboardQuickCapture";
import OperacionPanel from "@/components/dashboard/OperacionPanel";
import { UMBRAL_TALLER, UMBRAL_NISSAN } from "@/lib/alertas-config";
import Link from "next/link";
import { formatFechaMx, formatFechaHoraMx } from "@/lib/date-utils";
import { formatCargaFolio } from "@/lib/folio-format";

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

      <section className="order-3 mb-5 rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>Control de piso de taller</h2><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Órdenes activas por etapa</p></div>
            <Link href="/taller/ordenes" className="text-xs text-indigo-600 underline">Ver órdenes</Link>
          </div>
        </div>
        <div className="grid gap-3 p-3 lg:grid-cols-3">
          {([
            ["abierta", "ABIERTA"],
            ["en_proceso", "EN REPARACIÓN"],
            ["terminada", "PENDIENTE DE CIERRE"],
          ] as const).map(([estado, titulo]) => {
            const ordenes = stats.ordenesPiso.filter((orden) => orden.estado === estado);
            return <div key={estado} className="min-w-0 rounded-xl p-3" style={{ backgroundColor: "var(--surface-2)" }}>
              <div className="mb-2 flex justify-between text-xs font-bold"><span>{titulo}</span><span>{ordenes.length}</span></div>
              {ordenes.length ? ordenes.map((orden) => <Link key={orden.id} href={`/taller/${orden.id}`} className="mb-2 block rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                <p className="font-mono text-xs font-bold">{orden.folio ? `WB-${String(orden.folio).padStart(5, "0")}` : "Taller"} · {orden.unidad}</p>
                <p className="mt-1 line-clamp-2 text-xs">{orden.motivo}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>{formatFechaMx(orden.fecha)}</p>
              </Link>) : <p className="py-4 text-center text-xs" style={{ color: "var(--fg-muted)" }}>Sin órdenes en esta etapa.</p>}
            </div>;
          })}
        </div>
      </section>

      {/* Alertas proactivas */}
      <div className="order-4 mb-5">
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

      <section className="order-5 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <div><h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>Historial</h2><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Hoy y los dos días anteriores</p></div>
          <Link href="/cargas" className="text-xs font-semibold text-indigo-600 hover:underline">Ver Historial</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead><tr className="border-b text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--fg-muted)", backgroundColor: "var(--surface-2)" }}>
              {["Folio", "Fecha", "Unidad", "Operador", "Litros", "Odóm./HRS", "CUENTALT", "Origen"].map((label) => <th key={label} className="whitespace-nowrap px-4 py-3">{label}</th>)}
            </tr></thead>
            <tbody>
              {stats.historial.map((movimiento, index) => <tr key={movimiento.id} className="border-b transition-colors hover:bg-[var(--surface-2)]" style={{ borderColor: "var(--border)", backgroundColor: index % 2 ? "var(--surface)" : "var(--surface-2)" }}>
                <td className="whitespace-nowrap px-4 py-4 font-mono text-sm font-bold">{formatCargaFolio(movimiento.folio, movimiento.serie, movimiento.origen, movimiento.serieDigitos)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm">{formatFechaHoraMx(movimiento.fecha, null, movimiento.hora)}</td>
                <td className="whitespace-nowrap px-4 py-4 font-mono text-sm font-bold">{movimiento.unidad}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm" style={{ color: "var(--fg-muted)" }}>{movimiento.operador}</td>
                <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold">{movimiento.litros.toLocaleString("es-MX")} L</td>
                <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm">{movimiento.odometro?.toLocaleString("es-MX") ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-4 font-mono text-sm">{movimiento.cuentaInicio != null && movimiento.cuentaFin != null ? `${movimiento.cuentaInicio.toLocaleString("es-MX")} → ${movimiento.cuentaFin.toLocaleString("es-MX")}` : "—"}</td>
                <td className="px-4 py-4 text-sm"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${movimiento.origen === "campo" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>{movimiento.origen === "campo" ? "Campo" : "Patio"}</span></td>
              </tr>)}
              {!stats.historial.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "var(--fg-muted)" }}>Sin movimientos en estos días.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="order-6">
        <OperacionPanel
          operacion={stats.operacion}
          peorRendimiento={stats.alertasRendimiento}
          periodoCerradoId={stats.ultimoPeriodoCerrado?.id ?? null}
        />
      </div>
    </div>
  );
}
