"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CHECKLIST_PUNTOS, ESTADO_LABEL, type EstadoOrden } from "@/lib/taller-checklist";
import { guardarOrdenTaller, cerrarOrdenTaller, cancelarOrdenTaller, type RefaccionInput } from "@/app/actions/taller";
import ChecklistIngreso, { parseChecklistRow, serializeCheck, type CheckState } from "@/components/taller/ChecklistIngreso";
import { formatFechaHoraMx } from "@/lib/date-utils";

type Orden = {
  id: number;
  unidadId: number;
  operadorId: number | null;
  fecha: string;
  createdAt: string | Date | null;
  kmHrs: number | null;
  motivo: string | null;
  estado: string;
  esPreventivo: boolean;
  tipoControlPreventivo: string | null;
  quienRecibio: string | null;
  quienAtendio: string | null;
  comentarios: string | null;
  proximoMto: string | null;
  unidad: { codigo: string } | null;
  operador: { id: number; nombre: string } | null;
  abiertoPorNombre?: string | null;
  actualizadoPorNombre?: string | null;
  cerradoPorNombre?: string | null;
  log?: { accion: string; at: string | null; nombre: string }[];
  checklist: { clave: string; ok: boolean | null; nota: string | null; fotos?: string | null }[];
  refacciones: {
    descripcion: string;
    cantidad: number | null;
    cajas: number | null;
    precio: number | null;
    iva: boolean;
    proveedor: string | null;
    folioFactura: string | null;
  }[];
};

const emptyRef = (): RefaccionInput => ({
  descripcion: "",
  cantidad: 1,
  cajas: null,
  precio: null,
  iva: true,
  proveedor: "",
  folioFactura: "",
});

export default function OrdenDetalleForm({
  orden,
  operadores,
  canCerrar,
  sugeridas = { descripciones: [], proveedores: [] },
}: {
  orden: Orden;
  operadores: { id: number; nombre: string }[];
  canCerrar: boolean;
  sugeridas?: { descripciones: string[]; proveedores: string[] };
}) {
  const router = useRouter();
  const locked = orden.estado === "cerrada" || orden.estado === "cancelada";
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [operadorId, setOperadorId] = useState(orden.operadorId ? String(orden.operadorId) : "");
  const [fecha, setFecha] = useState(orden.fecha.slice(0, 10));
  const [kmHrs, setKmHrs] = useState(orden.kmHrs != null ? String(orden.kmHrs) : "");
  const [motivo, setMotivo] = useState(orden.motivo ?? "");
  const [quienRecibio, setQuienRecibio] = useState(orden.quienRecibio ?? "");
  const [quienAtendio, setQuienAtendio] = useState(orden.quienAtendio ?? "");
  const [comentarios, setComentarios] = useState(orden.comentarios ?? "");
  const [proximoMto, setProximoMto] = useState(orden.proximoMto ?? "");
  const esPreventivo = orden.esPreventivo;
  const tipoPrev = orden.tipoControlPreventivo === "hrs" ? "hrs" : "km";
  const [sec, setSec] = useState<"datos" | "ingreso" | "piezas">("datos");
  const [checks, setChecks] = useState<Record<string, CheckState>>(() => {
    const map: Record<string, CheckState> = {};
    for (const p of CHECKLIST_PUNTOS) {
      map[p.clave] = parseChecklistRow(orden.checklist.find((c) => c.clave === p.clave));
    }
    return map;
  });
  const [refs, setRefs] = useState<RefaccionInput[]>(
    orden.refacciones.map((r) => ({
      descripcion: r.descripcion,
      cantidad: r.cantidad,
      cajas: r.cajas,
      precio: r.precio,
      iva: r.iva,
      proveedor: r.proveedor ?? "",
      folioFactura: r.folioFactura ?? "",
    })),
  );
  const [refModal, setRefModal] = useState(false);
  const [refEdit, setRefEdit] = useState<number | null>(null);
  const [draft, setDraft] = useState<RefaccionInput>(emptyRef());
  const skipSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function payload() {
    return {
      operadorId: operadorId ? Number(operadorId) : null,
      fecha,
      kmHrs: kmHrs ? Number(kmHrs) : null,
      motivo,
      quienRecibio,
      quienAtendio,
      comentarios,
      proximoMto,
      esPreventivo,
      tipoControlPreventivo: esPreventivo ? tipoPrev : null,
      checklist: CHECKLIST_PUNTOS.map((p) => {
        const s = serializeCheck(checks[p.clave]);
        return { clave: p.clave, ok: checks[p.clave].ok, nota: s.nota || null, fotos: s.fotos };
      }),
      refacciones: refs,
    };
  }

  function save(estado?: "abierta" | "en_proceso", silent = false) {
    if (locked) return;
    setError("");
    start(async () => {
      try {
        await guardarOrdenTaller(orden.id, { ...payload(), estado });
        if (!silent) setOkMsg("Guardado.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  useEffect(() => {
    if (locked) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveTimer.current = setTimeout(() => save(undefined, true), 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, kmHrs, motivo, quienRecibio, quienAtendio, comentarios, proximoMto, operadorId, checks, refs]);

  function cerrar() {
    setError("");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    start(async () => {
      try {
        await cerrarOrdenTaller(orden.id, {
          quienAtendio,
          esPreventivo,
          tipoControlPreventivo: tipoPrev as "km" | "hrs",
          datos: payload(),
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cerrar");
      }
    });
  }

  function cancelar() {
    if (!confirm("¿Cancelar esta orden?")) return;
    start(async () => {
      try {
        await cancelarOrdenTaller(orden.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  const total = refs.reduce((s, r) => {
    const p = (r.precio ?? 0) * (r.cantidad ?? 1);
    return s + (r.iva ? p * 1.16 : p);
  }, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Orden #{orden.id}
          </p>
          <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
            <Link href={`/catalogo/unidades/${orden.unidadId}`} className="hover:underline">
              {orden.unidad?.codigo ?? "Unidad"}
            </Link>
          </h1>
          <p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Creada {formatFechaHoraMx(orden.fecha, orden.createdAt instanceof Date ? orden.createdAt.toISOString() : orden.createdAt)}
          </p>
        </div>
        {!locked ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => save(orden.estado === "en_proceso" ? "abierta" : "en_proceso")}
            title="Toca para pasar a en proceso o abierta"
          >
            <Badge variant={orden.estado === "en_proceso" ? "default" : "warning"}>
              {ESTADO_LABEL[orden.estado as EstadoOrden] ?? orden.estado}
            </Badge>
          </button>
        ) : (
          <Badge variant={orden.estado === "cerrada" ? "success" : "secondary"}>
            {ESTADO_LABEL[orden.estado as EstadoOrden] ?? orden.estado}
          </Badge>
        )}
      </div>
      {okMsg && (
        <p className="text-sm font-semibold text-emerald-700 rounded-xl border px-3 py-2" style={{ borderColor: "rgb(16 185 129 / 0.35)", backgroundColor: "rgb(16 185 129 / 0.08)" }}>
          {okMsg}
        </p>
      )}

      <div className="flex gap-1 p-1 rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        {([
          ["datos", "Datos"],
          ["ingreso", "Checklist"],
          ["piezas", "Refacciones"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSec(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold ${sec === k ? "bg-indigo-600 text-white" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {sec === "datos" && <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Fecha</Label>
            <Input type="date" disabled={locked} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <Label>Km / hrs</Label>
            <Input type="number" disabled={locked} value={kmHrs} onChange={(e) => setKmHrs(e.target.value)} />
          </div>
          <div>
            <Label>Operador</Label>
            <Select disabled={locked} value={operadorId} onChange={(e) => setOperadorId(e.target.value)}>
              <option value="">—</option>
              {operadores.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Quién recibió</Label>
            <Input disabled={locked} value={quienRecibio} onChange={(e) => setQuienRecibio(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Motivo</Label>
          <Input disabled={locked} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <div>
          <Label>Comentarios / próximo mto</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input disabled={locked} placeholder="Comentarios" value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
            <Input disabled={locked} placeholder="Próximo mantenimiento" value={proximoMto} onChange={(e) => setProximoMto(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Quién atendió</Label>
          <Input disabled={locked} value={quienAtendio} onChange={(e) => setQuienAtendio(e.target.value)} placeholder="Oscar y Carlos" />
        </div>
        <p className="text-[11px] pt-2" style={{ color: "var(--fg-muted)" }}>
          {orden.abiertoPorNombre ? `Abrió ${orden.abiertoPorNombre}` : "—"}
          {orden.actualizadoPorNombre ? ` · última edición ${orden.actualizadoPorNombre}` : ""}
          {orden.cerradoPorNombre ? ` · cerró ${orden.cerradoPorNombre}` : ""}
        </p>
      </div>}

      {sec === "ingreso" && (
        <ChecklistIngreso value={checks} onChange={setChecks} locked={locked} />
      )}

      {sec === "piezas" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Refacciones</p>
              {total > 0 && (
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                </p>
              )}
            </div>
            {!locked && (
              <button
                type="button"
                className="text-xs font-semibold flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 text-white"
                onClick={() => {
                  setRefEdit(null);
                  setDraft(emptyRef());
                  setRefModal(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            )}
          </div>
          {refs.filter((r) => r.descripcion.trim()).length === 0 ? (
            <button
              type="button"
              disabled={locked}
              onClick={() => { setRefEdit(null); setDraft(emptyRef()); setRefModal(true); }}
              className="w-full rounded-2xl border border-dashed py-10 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
            >
              Sin piezas. Toca para agregar.
            </button>
          ) : (
            <ul className="space-y-2">
              {refs.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => { setRefEdit(i); setDraft(r); setRefModal(true); }}
                    className="w-full text-left rounded-2xl border px-3 py-3"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{r.descripcion || "Sin nombre"}</p>
                      <p className="text-sm font-mono shrink-0">
                        {r.precio
                          ? ((r.precio ?? 0) * (r.cantidad ?? 1) * (r.iva === false ? 1 : 1.16)).toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                          : ""}
                      </p>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                      {r.cantidad ?? 1} pza
                      {r.proveedor ? ` · ${r.proveedor}` : ""}
                      {r.folioFactura ? ` · ${r.folioFactura}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Dialog open={refModal} onOpenChange={setRefModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{refEdit == null ? "Agregar pieza" : "Editar pieza"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Qué se usó</Label>
                  <Input list="ref-desc" value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} placeholder="Booster, pastas…" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cantidad</Label>
                    <Input type="number" inputMode="decimal" value={draft.cantidad ?? ""} onChange={(e) => setDraft({ ...draft, cantidad: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                  <div>
                    <Label>Precio</Label>
                    <Input type="number" inputMode="decimal" value={draft.precio ?? ""} onChange={(e) => setDraft({ ...draft, precio: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={draft.iva !== false} onChange={(e) => setDraft({ ...draft, iva: e.target.checked })} />
                  Incluye IVA
                </label>
                <div>
                  <Label>Proveedor</Label>
                  <Input list="ref-prov" value={draft.proveedor ?? ""} onChange={(e) => setDraft({ ...draft, proveedor: e.target.value })} />
                </div>
                <div>
                  <Label>Factura</Label>
                  <Input value={draft.folioFactura ?? ""} onChange={(e) => setDraft({ ...draft, folioFactura: e.target.value })} />
                </div>
                <datalist id="ref-desc">
                  {sugeridas.descripciones.map((d) => <option key={d} value={d} />)}
                </datalist>
                <datalist id="ref-prov">
                  {sugeridas.proveedores.map((d) => <option key={d} value={d} />)}
                </datalist>
                <div className="flex gap-2 pt-1">
                  {refEdit != null && (
                    <button
                      type="button"
                      className="px-3 py-2.5 rounded-xl text-sm"
                      style={{ color: "var(--fg-muted)" }}
                      onClick={() => {
                        setRefs((all) => all.filter((_, j) => j !== refEdit));
                        setRefModal(false);
                      }}
                    >
                      Quitar
                    </button>
                  )}
                  <button type="button" className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)" }} onClick={() => setRefModal(false)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white"
                    onClick={() => {
                      if (!draft.descripcion.trim()) return;
                      if (refEdit == null) setRefs((all) => [...all, draft]);
                      else setRefs((all) => all.map((x, j) => (j === refEdit ? draft : x)));
                      setRefModal(false);
                    }}
                  >
                    {refEdit == null ? "Agregar" : "Listo"}
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {pending && !error && (
        <p className="text-[11px] text-center" style={{ color: "var(--fg-muted)" }}>Guardando…</p>
      )}

      {canCerrar && !locked && (
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            disabled={pending}
            onClick={cerrar}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-indigo-600 text-white disabled:opacity-50"
          >
            Cerrar · ya terminó
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={cancelar}
            className="px-4 py-3 rounded-xl text-sm font-semibold border"
            style={{ borderColor: "var(--border)" }}
          >
            Anular
          </button>
        </div>
      )}
    </div>
  );
}
