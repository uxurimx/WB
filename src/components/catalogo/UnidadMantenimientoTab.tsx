"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Save, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  registrarMantenimientoUnidad,
  type ResumenMantenimientoUnidad,
  type TipoControlMantenimiento,
  upsertPlanMantenimiento,
} from "@/app/actions/mantenimiento";
import { useRouter } from "next/navigation";

type EventoMantenimiento = {
  id: number;
  unidadId: number;
  planId: number | null;
  tipoControl: string;
  fechaServicio: string;
  lecturaServicio: number;
  descripcion: string | null;
  notas: string | null;
  registradoPorId: string | null;
  createdAt: Date | null;
};

function fmtNum(n: number | null | undefined, d = 0) {
  if (n == null) return "—";
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function statusVariant(estado: ResumenMantenimientoUnidad["estadoGlobal"] | "ok" | "proximo" | "vencido" | "sin_config") {
  if (estado === "ok") return "success" as const;
  if (estado === "proximo") return "warning" as const;
  if (estado === "vencido") return "danger" as const;
  return "secondary" as const;
}

function statusLabel(estado: "ok" | "proximo" | "vencido" | "sin_config") {
  if (estado === "ok") return "OK";
  if (estado === "proximo") return "Próximo";
  if (estado === "vencido") return "Vencido";
  return "Sin config";
}

function planTitle(tipo: TipoControlMantenimiento) {
  return tipo === "km" ? "Plan KM" : "Plan HRS";
}

export default function UnidadMantenimientoTab({
  unidadId,
  resumen,
  eventos,
  canManageMaintenance,
}: {
  unidadId: number;
  resumen: ResumenMantenimientoUnidad | null;
  eventos: EventoMantenimiento[];
  canManageMaintenance: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [planForms, setPlanForms] = useState<Record<TipoControlMantenimiento, {
    intervalo: string;
    umbralAlerta: string;
    activo: boolean;
    notas: string;
  }>>({
    km: {
      intervalo: resumen?.planes.find((p) => p.tipoControl === "km")?.intervalo != null
        ? String(resumen.planes.find((p) => p.tipoControl === "km")?.intervalo ?? "")
        : "",
      umbralAlerta: resumen?.planes.find((p) => p.tipoControl === "km")?.umbralAlerta != null
        ? String(resumen.planes.find((p) => p.tipoControl === "km")?.umbralAlerta ?? "")
        : "",
      activo: resumen?.planes.find((p) => p.tipoControl === "km")?.activo ?? true,
      notas: "",
    },
    hrs: {
      intervalo: resumen?.planes.find((p) => p.tipoControl === "hrs")?.intervalo != null
        ? String(resumen.planes.find((p) => p.tipoControl === "hrs")?.intervalo ?? "")
        : "",
      umbralAlerta: resumen?.planes.find((p) => p.tipoControl === "hrs")?.umbralAlerta != null
        ? String(resumen.planes.find((p) => p.tipoControl === "hrs")?.umbralAlerta ?? "")
        : "",
      activo: resumen?.planes.find((p) => p.tipoControl === "hrs")?.activo ?? true,
      notas: "",
    },
  });
  const [registroForm, setRegistroForm] = useState({
    tipoControl: "km" as TipoControlMantenimiento,
    fechaServicio: new Date().toISOString().slice(0, 10),
    lecturaServicio: "",
    descripcion: "",
    notas: "",
  });

  const eventosOrdenados = useMemo(
    () => [...eventos].sort((a, b) => {
      const dateCmp = b.fechaServicio.localeCompare(a.fechaServicio);
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0);
    }),
    [eventos],
  );

  function updatePlanForm(tipo: TipoControlMantenimiento, key: "intervalo" | "umbralAlerta" | "activo" | "notas", value: string | boolean) {
    setPlanForms((prev) => ({
      ...prev,
      [tipo]: { ...prev[tipo], [key]: value },
    }));
  }

  function savePlan(tipo: TipoControlMantenimiento) {
    setError("");
    setSuccess("");
    const form = planForms[tipo];
    const intervalo = parseFloat(form.intervalo);
    const umbralAlerta = parseFloat(form.umbralAlerta);
    if (Number.isNaN(intervalo) || intervalo <= 0) {
      setError(`El intervalo de ${tipo.toUpperCase()} debe ser mayor a 0.`);
      return;
    }
    if (Number.isNaN(umbralAlerta) || umbralAlerta < 0) {
      setError(`El umbral de ${tipo.toUpperCase()} no puede ser negativo.`);
      return;
    }

    startTransition(async () => {
      try {
        await upsertPlanMantenimiento({
          unidadId,
          tipoControl: tipo,
          intervalo,
          umbralAlerta,
          activo: form.activo,
          notas: form.notas || null,
        });
        setSuccess(`Plan ${tipo.toUpperCase()} guardado.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar el plan.");
      }
    });
  }

  function registrarMantenimiento() {
    setError("");
    setSuccess("");
    const lecturaServicio = parseFloat(registroForm.lecturaServicio);
    if (Number.isNaN(lecturaServicio) || lecturaServicio < 0) {
      setError("La lectura del servicio debe ser válida.");
      return;
    }

    startTransition(async () => {
      try {
        await registrarMantenimientoUnidad({
          unidadId,
          tipoControl: registroForm.tipoControl,
          fechaServicio: registroForm.fechaServicio,
          lecturaServicio,
          descripcion: registroForm.descripcion || null,
          notas: registroForm.notas || null,
        });
        setSuccess("Mantenimiento registrado.");
        setRegistroForm((prev) => ({
          ...prev,
          lecturaServicio: "",
          descripcion: "",
          notas: "",
        }));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar mantenimiento.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Mantenimiento preventivo
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant(resumen?.estadoGlobal ?? "sin_config")}>
              {statusLabel(resumen?.estadoGlobal ?? "sin_config")}
            </Badge>
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
              Estado global de la unidad
            </p>
          </div>
        </div>
        {!canManageMaintenance && (
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            Solo admin y gerente pueden editar configuración o registrar servicios.
          </p>
        )}
      </div>

      {(error || success) && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: error ? "rgb(239 68 68 / 0.25)" : "rgb(16 185 129 / 0.25)",
            backgroundColor: error ? "rgb(239 68 68 / 0.06)" : "rgb(16 185 129 / 0.06)",
            color: error ? "rgb(220 38 38)" : "rgb(5 150 105)",
          }}
        >
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {(["km", "hrs"] as TipoControlMantenimiento[]).map((tipo) => {
          const plan = resumen?.planes.find((p) => p.tipoControl === tipo) ?? null;
          const form = planForms[tipo];
          return (
            <section
              key={tipo}
              className="rounded-2xl border p-4 space-y-4"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold" style={{ color: "var(--fg)" }}>{planTitle(tipo)}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                    Configuración y estado del mantenimiento por {tipo.toUpperCase()}.
                  </p>
                </div>
                <Badge variant={statusVariant(plan?.estado ?? "sin_config")}>
                  {statusLabel(plan?.estado ?? "sin_config")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                    Lectura actual
                  </p>
                  <p className="font-mono font-bold text-lg" style={{ color: "var(--fg)" }}>
                    {fmtNum(plan?.lecturaActual)}
                  </p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                    Último servicio
                  </p>
                  <p className="font-mono font-bold text-lg" style={{ color: "var(--fg)" }}>
                    {fmtNum(plan?.lecturaServicio)}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
                    {plan?.fechaServicio ?? "Sin registro"}
                  </p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                    Próximo servicio
                  </p>
                  <p className="font-mono font-bold text-lg" style={{ color: "var(--fg)" }}>
                    {fmtNum(plan?.proximoServicioEn)}
                  </p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                    Faltante / excedente
                  </p>
                  <p className="font-mono font-bold text-lg" style={{ color: "var(--fg)" }}>
                    {plan?.faltante == null
                      ? "—"
                      : plan.faltante >= 0
                        ? `${fmtNum(plan.faltante)}`
                        : `-${fmtNum(plan.excedente)}`}
                  </p>
                </div>
              </div>

              {plan?.inconsistencia && (
                <div
                  className="rounded-xl border px-3 py-2 text-sm flex items-start gap-2"
                  style={{
                    borderColor: "rgb(245 158 11 / 0.25)",
                    backgroundColor: "rgb(245 158 11 / 0.06)",
                    color: "rgb(180 83 9)",
                  }}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{plan.inconsistencia}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`${tipo}-intervalo`}>Intervalo</Label>
                  <Input
                    id={`${tipo}-intervalo`}
                    type="number"
                    step="1"
                    disabled={!canManageMaintenance || pending}
                    value={form.intervalo}
                    onChange={(e) => updatePlanForm(tipo, "intervalo", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`${tipo}-umbral`}>Umbral alerta</Label>
                  <Input
                    id={`${tipo}-umbral`}
                    type="number"
                    step="1"
                    disabled={!canManageMaintenance || pending}
                    value={form.umbralAlerta}
                    onChange={(e) => updatePlanForm(tipo, "umbralAlerta", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={`${tipo}-activo`}
                  type="checkbox"
                  className="rounded border"
                  disabled={!canManageMaintenance || pending}
                  checked={form.activo}
                  onChange={(e) => updatePlanForm(tipo, "activo", e.target.checked)}
                />
                <Label htmlFor={`${tipo}-activo`}>Plan activo</Label>
              </div>

              <div>
                <Label htmlFor={`${tipo}-notas`}>Notas del plan</Label>
                <Textarea
                  id={`${tipo}-notas`}
                  rows={3}
                  disabled={!canManageMaintenance || pending}
                  value={form.notas}
                  onChange={(e) => updatePlanForm(tipo, "notas", e.target.value)}
                  placeholder={`Ej. servicio preventivo cada ${tipo.toUpperCase()}`}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={!canManageMaintenance || pending}
                  onClick={() => savePlan(tipo)}
                >
                  <Save className="w-4 h-4" />
                  Guardar plan {tipo.toUpperCase()}
                </Button>
              </div>
            </section>
          );
        })}
      </div>

      <section
        className="rounded-2xl border p-4 space-y-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-indigo-500" />
          <div>
            <p className="font-semibold" style={{ color: "var(--fg)" }}>Registrar mantenimiento</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Crea un evento de servicio que servirá como nueva base del cálculo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="reg-tipo">Tipo control</Label>
            <select
              id="reg-tipo"
              className="w-full h-10 rounded-md border px-3 text-sm"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
              disabled={!canManageMaintenance || pending}
              value={registroForm.tipoControl}
              onChange={(e) => setRegistroForm((prev) => ({ ...prev, tipoControl: e.target.value as TipoControlMantenimiento }))}
            >
              <option value="km">KM</option>
              <option value="hrs">HRS</option>
            </select>
          </div>
          <div>
            <Label htmlFor="reg-fecha">Fecha servicio</Label>
            <Input
              id="reg-fecha"
              type="date"
              disabled={!canManageMaintenance || pending}
              value={registroForm.fechaServicio}
              onChange={(e) => setRegistroForm((prev) => ({ ...prev, fechaServicio: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="reg-lectura">Lectura servicio</Label>
            <Input
              id="reg-lectura"
              type="number"
              step="1"
              disabled={!canManageMaintenance || pending}
              value={registroForm.lecturaServicio}
              onChange={(e) => setRegistroForm((prev) => ({ ...prev, lecturaServicio: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="reg-desc">Descripción</Label>
            <Input
              id="reg-desc"
              disabled={!canManageMaintenance || pending}
              value={registroForm.descripcion}
              onChange={(e) => setRegistroForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Ej. servicio preventivo 10,000 km"
            />
          </div>
          <div>
            <Label htmlFor="reg-notas">Notas</Label>
            <Input
              id="reg-notas"
              disabled={!canManageMaintenance || pending}
              value={registroForm.notas}
              onChange={(e) => setRegistroForm((prev) => ({ ...prev, notas: e.target.value }))}
              placeholder="Detalles opcionales"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!canManageMaintenance || pending}
            onClick={registrarMantenimiento}
          >
            <Clock3 className="w-4 h-4" />
            Registrar mantenimiento
          </Button>
        </div>
      </section>

      <section
        className="rounded-2xl border p-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <div>
            <p className="font-semibold" style={{ color: "var(--fg)" }}>Historial de mantenimientos</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Eventos registrados para esta unidad.
            </p>
          </div>
        </div>

        {eventosOrdenados.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Sin mantenimientos registrados aún.
          </p>
        ) : (
          <div className="space-y-2">
            {eventosOrdenados.map((evento) => (
              <div
                key={evento.id}
                className="rounded-xl border p-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{evento.tipoControl.toUpperCase()}</Badge>
                      <span className="font-mono font-semibold" style={{ color: "var(--fg)" }}>
                        {fmtNum(evento.lecturaServicio)}
                      </span>
                      <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                        {evento.fechaServicio}
                      </span>
                    </div>
                    {evento.descripcion && (
                      <p className="text-sm mt-1" style={{ color: "var(--fg)" }}>
                        {evento.descripcion}
                      </p>
                    )}
                    {evento.notas && (
                      <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                        {evento.notas}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-right" style={{ color: "var(--fg-muted)" }}>
                    <p>Registrado</p>
                    <p>{evento.createdAt?.toISOString().slice(0, 10) ?? "—"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
