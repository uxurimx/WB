"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Gauge, RotateCcw, Save, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  registrarMantenimientoUnidad,
  updateEventoMantenimiento,
  type ResumenMantenimientoUnidad,
  type TipoControlMantenimiento,
  upsertPlanMantenimiento,
} from "@/app/actions/mantenimiento";
import { registrarResetOdometro } from "@/app/actions/cargas";
import { getNowLocal } from "@/lib/date-utils";
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

type ResetItem = {
  id: number;
  fecha: string;
  lecturaAnterior: number;
  lecturaNueva: number;
  notas: string | null;
};

export default function UnidadMantenimientoTab({
  unidadId,
  resumen,
  eventos,
  canManageMaintenance,
  odometroActual = null,
  odometroOffset = 0,
  resets = [],
}: {
  unidadId: number;
  resumen: ResumenMantenimientoUnidad | null;
  eventos: EventoMantenimiento[];
  canManageMaintenance: boolean;
  odometroActual?: number | null;
  odometroOffset?: number | null;
  resets?: ResetItem[];
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
    fechaServicio: getNowLocal().fecha,
    lecturaServicio: "",
    descripcion: "",
    notas: "",
  });
  const [resetForm, setResetForm] = useState({
    fecha: getNowLocal().fecha,
    lecturaAnterior: odometroActual != null ? String(odometroActual) : "",
    lecturaNueva: "0",
    notas: "",
  });
  const [editingEventoId, setEditingEventoId] = useState<number | null>(null);
  const [eventoEdit, setEventoEdit] = useState({ fechaServicio: "", lecturaServicio: "", descripcion: "", notas: "" });
  const [planModal, setPlanModal] = useState<TipoControlMantenimiento | null>(null);
  const [resetModal, setResetModal] = useState(false);
  const [servicioModal, setServicioModal] = useState(false);

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
        setPlanModal(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar el plan.");
      }
    });
  }

  function registrarReset() {
    setError("");
    setSuccess("");
    const lecturaAnterior = parseFloat(resetForm.lecturaAnterior);
    const lecturaNueva = parseFloat(resetForm.lecturaNueva);
    if (Number.isNaN(lecturaAnterior) || lecturaAnterior < 0 || Number.isNaN(lecturaNueva) || lecturaNueva < 0) {
      setError("Las lecturas del reset deben ser números válidos.");
      return;
    }
    startTransition(async () => {
      try {
        await registrarResetOdometro({
          unidadId,
          fecha: resetForm.fecha,
          lecturaAnterior,
          lecturaNueva,
          notas: resetForm.notas || undefined,
        });
        setSuccess("Reset de hubodómetro registrado. Las próximas cargas usan la lectura nueva.");
        setResetModal(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar el reset.");
      }
    });
  }

  function startEditEvento(evento: EventoMantenimiento) {
    setEditingEventoId(evento.id);
    setEventoEdit({
      fechaServicio: evento.fechaServicio,
      lecturaServicio: String(evento.lecturaServicio),
      descripcion: evento.descripcion ?? "",
      notas: evento.notas ?? "",
    });
  }

  function saveEvento() {
    if (editingEventoId == null) return;
    const lecturaServicio = parseFloat(eventoEdit.lecturaServicio);
    if (Number.isNaN(lecturaServicio) || lecturaServicio < 0) {
      setError("La lectura del servicio debe ser válida.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await updateEventoMantenimiento({
          id: editingEventoId,
          fechaServicio: eventoEdit.fechaServicio,
          lecturaServicio,
          descripcion: eventoEdit.descripcion || null,
          notas: eventoEdit.notas || null,
        });
        setSuccess("Mantenimiento actualizado.");
        setEditingEventoId(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al editar mantenimiento.");
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
        setServicioModal(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar mantenimiento.");
      }
    });
  }


  const planFormActivo = planModal ? planForms[planModal] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(resumen?.estadoGlobal ?? "sin_config")}>
            {statusLabel(resumen?.estadoGlobal ?? "sin_config")}
          </Badge>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Estado de mantenimiento</p>
        </div>
      </div>

      {(error || success) && (
        <div
          className="rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: error ? "rgb(239 68 68 / 0.25)" : "rgb(16 185 129 / 0.25)",
            backgroundColor: error ? "rgb(239 68 68 / 0.06)" : "rgb(16 185 129 / 0.06)",
            color: error ? "rgb(220 38 38)" : "rgb(5 150 105)",
          }}
        >
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(["km", "hrs"] as TipoControlMantenimiento[]).map((tipo) => {
          const plan = resumen?.planes.find((p) => p.tipoControl === tipo) ?? null;
          return (
            <div
              key={tipo}
              className="rounded-2xl border px-3 py-3 space-y-2"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-500" />
                  <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{planTitle(tipo)}</p>
                </div>
                <Badge variant={statusVariant(plan?.estado ?? "sin_config")}>
                  {statusLabel(plan?.estado ?? "sin_config")}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Actual</p>
                  <p className="font-mono font-bold text-sm" style={{ color: "var(--fg)" }}>{fmtNum(plan?.lecturaActual)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Próximo</p>
                  <p className="font-mono font-bold text-sm" style={{ color: "var(--fg)" }}>{fmtNum(plan?.proximoServicioEn)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Falta</p>
                  <p className="font-mono font-bold text-sm" style={{ color: "var(--fg)" }}>
                    {plan?.faltante == null ? "—" : plan.faltante >= 0 ? fmtNum(plan.faltante) : `-${fmtNum(plan.excedente)}`}
                  </p>
                </div>
              </div>
              {plan?.inconsistencia && (
                <p className="text-[11px] text-amber-700 flex items-start gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {plan.inconsistencia}
                </p>
              )}
              {canManageMaintenance && (
                <button
                  type="button"
                  onClick={() => setPlanModal(tipo)}
                  className="w-full text-xs font-semibold py-1.5 rounded-lg border hover:bg-[var(--surface-2)]"
                  style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                >
                  Configurar
                </button>
              )}
            </div>
          );
        })}
      </div>

      {canManageMaintenance && (
        <div className="flex gap-2">
          <Button type="button" size="sm" className="flex-1" onClick={() => setServicioModal(true)}>
            <Wrench className="w-4 h-4" /> Registrar servicio
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setResetModal(true)}>
            <RotateCcw className="w-4 h-4" /> Reset hub
          </Button>
        </div>
      )}

      {!canManageMaintenance && (
        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
          Solo admin y gerente pueden editar configuración o registrar servicios.
        </p>
      )}

      <section
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>Historial</p>
          <span className="ml-auto text-xs" style={{ color: "var(--fg-muted)" }}>{eventosOrdenados.length}</span>
        </div>
        {eventosOrdenados.length === 0 ? (
          <p className="px-3 py-6 text-sm text-center" style={{ color: "var(--fg-muted)" }}>
            Sin mantenimientos registrados.
          </p>
        ) : (
          <ul>
            {eventosOrdenados.map((evento) => (
              <li
                key={evento.id}
                className="px-3 py-2.5 border-b last:border-b-0 flex items-start justify-between gap-2"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{evento.tipoControl.toUpperCase()}</Badge>
                    <span className="font-mono font-semibold text-sm" style={{ color: "var(--fg)" }}>
                      {fmtNum(evento.lecturaServicio)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{evento.fechaServicio}</span>
                  </div>
                  {evento.descripcion && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>{evento.descripcion}</p>
                  )}
                </div>
                {canManageMaintenance && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-500 shrink-0"
                    onClick={() => startEditEvento(evento)}
                  >
                    Editar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {resets.length > 0 && (
        <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
          Último reset: {resets[0].fecha} · {fmtNum(resets[0].lecturaAnterior)} → {fmtNum(resets[0].lecturaNueva)}
          {resets[0].notas ? ` · ${resets[0].notas}` : ""}
        </p>
      )}

      <Dialog open={planModal !== null} onOpenChange={(o) => { if (!o) setPlanModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{planModal ? planTitle(planModal) : "Plan"}</DialogTitle>
            <DialogDescription>Intervalo, umbral de alerta y estado del plan.</DialogDescription>
          </DialogHeader>
          {planModal && planFormActivo && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="plan-intervalo">Intervalo</Label>
                  <Input id="plan-intervalo" type="number" step="1" disabled={pending}
                    value={planFormActivo.intervalo}
                    onChange={(e) => updatePlanForm(planModal, "intervalo", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="plan-umbral">Umbral alerta</Label>
                  <Input id="plan-umbral" type="number" step="1" disabled={pending}
                    value={planFormActivo.umbralAlerta}
                    onChange={(e) => updatePlanForm(planModal, "umbralAlerta", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input id="plan-activo" type="checkbox" className="rounded border" disabled={pending}
                  checked={planFormActivo.activo}
                  onChange={(e) => updatePlanForm(planModal, "activo", e.target.checked)} />
                <Label htmlFor="plan-activo">Plan activo</Label>
              </div>
              <div>
                <Label htmlFor="plan-notas">Notas</Label>
                <Textarea id="plan-notas" rows={3} disabled={pending} value={planFormActivo.notas}
                  onChange={(e) => updatePlanForm(planModal, "notas", e.target.value)}
                  placeholder={`Ej. servicio preventivo cada ${planModal.toUpperCase()}`} />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setPlanModal(null)}>Cancelar</Button>
                <Button type="button" disabled={pending} onClick={() => savePlan(planModal)}>
                  <Save className="w-4 h-4" /> Guardar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={resetModal} onOpenChange={setResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset de hubodómetro</DialogTitle>
            <DialogDescription>
              Si el km volvió a 0 (cambio de rin/hub), regístralo aquí. Hub actual: {fmtNum(odometroActual)} · acumulado: {fmtNum((odometroActual ?? 0) + (odometroOffset ?? 0))}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reset-fecha">Fecha</Label>
              <Input id="reset-fecha" type="date" disabled={pending} value={resetForm.fecha}
                onChange={(e) => setResetForm((p) => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reset-ant">Lectura anterior</Label>
                <Input id="reset-ant" type="number" disabled={pending} value={resetForm.lecturaAnterior}
                  onChange={(e) => setResetForm((p) => ({ ...p, lecturaAnterior: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="reset-new">Lectura nueva</Label>
                <Input id="reset-new" type="number" disabled={pending} value={resetForm.lecturaNueva}
                  onChange={(e) => setResetForm((p) => ({ ...p, lecturaNueva: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="reset-notas">Notas</Label>
              <Input id="reset-notas" disabled={pending} value={resetForm.notas} placeholder="Cambio de rin / hub"
                onChange={(e) => setResetForm((p) => ({ ...p, notas: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setResetModal(false)}>Cancelar</Button>
              <Button type="button" disabled={pending} onClick={registrarReset}>Registrar reset</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={servicioModal} onOpenChange={setServicioModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar servicio</DialogTitle>
            <DialogDescription>Queda como nueva base del cálculo de mantenimiento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="reg-tipo">Tipo</Label>
                <select id="reg-tipo" className="w-full h-10 rounded-md border px-3 text-sm"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
                  disabled={pending} value={registroForm.tipoControl}
                  onChange={(e) => setRegistroForm((prev) => ({ ...prev, tipoControl: e.target.value as TipoControlMantenimiento }))}>
                  <option value="km">KM</option>
                  <option value="hrs">HRS</option>
                </select>
              </div>
              <div>
                <Label htmlFor="reg-fecha">Fecha</Label>
                <Input id="reg-fecha" type="date" disabled={pending} value={registroForm.fechaServicio}
                  onChange={(e) => setRegistroForm((prev) => ({ ...prev, fechaServicio: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="reg-lectura">Lectura</Label>
                <Input id="reg-lectura" type="number" step="1" disabled={pending} value={registroForm.lecturaServicio}
                  onChange={(e) => setRegistroForm((prev) => ({ ...prev, lecturaServicio: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="reg-desc">Descripción</Label>
              <Input id="reg-desc" disabled={pending} value={registroForm.descripcion}
                onChange={(e) => setRegistroForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Ej. servicio preventivo 10,000 km" />
            </div>
            <div>
              <Label htmlFor="reg-notas">Notas</Label>
              <Input id="reg-notas" disabled={pending} value={registroForm.notas}
                onChange={(e) => setRegistroForm((prev) => ({ ...prev, notas: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setServicioModal(false)}>Cancelar</Button>
              <Button type="button" disabled={pending} onClick={registrarMantenimiento}>
                <Clock3 className="w-4 h-4" /> Registrar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editingEventoId !== null} onOpenChange={(o) => { if (!o) setEditingEventoId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar mantenimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={eventoEdit.fechaServicio} disabled={pending}
                  onChange={(e) => setEventoEdit((p) => ({ ...p, fechaServicio: e.target.value }))} />
              </div>
              <div>
                <Label>Lectura</Label>
                <Input type="number" value={eventoEdit.lecturaServicio} disabled={pending}
                  onChange={(e) => setEventoEdit((p) => ({ ...p, lecturaServicio: e.target.value }))} />
              </div>
            </div>
            <Input placeholder="Descripción" value={eventoEdit.descripcion} disabled={pending}
              onChange={(e) => setEventoEdit((p) => ({ ...p, descripcion: e.target.value }))} />
            <Input placeholder="Notas" value={eventoEdit.notas} disabled={pending}
              onChange={(e) => setEventoEdit((p) => ({ ...p, notas: e.target.value }))} />
            <DialogFooter>
              <Button type="button" variant="secondary" disabled={pending} onClick={() => setEditingEventoId(null)}>Cancelar</Button>
              <Button type="button" disabled={pending} onClick={saveEvento}>Guardar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
