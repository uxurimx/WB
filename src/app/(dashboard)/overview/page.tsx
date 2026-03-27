import { auth, currentUser } from "@clerk/nextjs/server";
import { Fuel, Truck, Wrench, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function OverviewPage() {
  const { userId } = await auth();
  const user = await currentUser();

  const greeting = user?.firstName
    ? `Bienvenido, ${user.firstName}.`
    : "Bienvenido.";

  // Placeholder stats — se conectarán a la DB en Fase 2
  const stats = [
    {
      label: "Stock Taller",
      value: "—",
      unit: "litros",
      icon: Fuel,
      color: "indigo",
      hint: "Diesel disponible en taller",
    },
    {
      label: "NISSAN",
      value: "—",
      unit: "/ 1200 L",
      icon: Truck,
      color: "violet",
      hint: "Saldo actual en camión NISSAN",
    },
    {
      label: "Cargas Hoy",
      value: "—",
      unit: "eventos",
      icon: Wrench,
      color: "purple",
      hint: "Despachos registrados hoy",
    },
    {
      label: "Alertas",
      value: "—",
      unit: "activas",
      icon: AlertTriangle,
      color: "amber",
      hint: "Unidades fuera de tolerancia",
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
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
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Control de diesel y rendimiento de flota en tiempo real.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, unit, icon: Icon, hint }) => (
          <Card key={label}>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
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
                className="font-outfit font-bold text-3xl mb-0.5"
                style={{ color: "var(--fg)" }}
              >
                {value}
              </p>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {unit} — {hint}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos pasos</CardTitle>
          <CardDescription>
            El sistema base está listo. Estos módulos se activarán fase a fase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                fase: "Fase 1",
                title: "Captura de cargas",
                desc: "Registrar despachos de diesel desde patio y campo.",
                status: "pending" as const,
              },
              {
                fase: "Fase 2",
                title: "Dashboard en tiempo real",
                desc: "Stock, cargas del día y alertas actualizados vía Pusher.",
                status: "pending" as const,
              },
              {
                fase: "Fase 3",
                title: "Rendimientos automáticos",
                desc: "Cálculo automático al cerrar cada período semanal.",
                status: "pending" as const,
              },
              {
                fase: "Fase 4",
                title: "Reportes y exportación",
                desc: "Reporte semanal en PDF/Excel con un clic.",
                status: "pending" as const,
              },
            ].map(({ fase, title, desc, status }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-4 rounded-xl border"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}
              >
                <Badge variant="secondary" className="mt-0.5 shrink-0">
                  {fase}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold mb-0.5"
                    style={{ color: "var(--fg)" }}
                  >
                    {title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                    {desc}
                  </p>
                </div>
                <Badge variant="warning" className="shrink-0">
                  Pendiente
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
