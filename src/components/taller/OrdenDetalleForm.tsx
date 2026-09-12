"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CHECKLIST_PUNTOS, ESTADO_LABEL, type EstadoOrden } from "@/lib/taller-checklist";
import { guardarOrdenTaller, cerrarOrdenTaller, cancelarOrdenTaller, type RefaccionInput } from "@/app/actions/taller";

type Orden = {
  id: number;
  unidadId: number;
  operadorId: number | null;
  fecha: string;
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
  checklist: { clave: string; ok: boolean | null; nota: string | null }[];
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
}: {
  orden: Orden;
  operadores: { id: number; nombre: string }[];
  canCerrar: boolean;
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
  const [esPreventivo, setEsPreventivo] = useState(orden.esPreventivo);
  const [tipoPrev, setTipoPrev] = useState(orden.tipoControlPreventivo === "hrs" ? "hrs" : "km");
  const [checks, setChecks] = useState(() => {
    const map: Record<string, { ok: boolean | null; nota: string }> = {};
    for (const p of CHECKLIST_PUNTOS) {
      const row = orden.checklist.find((c) => c.clave === p.clave);
      map[p.clave] = { ok: row?.ok ?? null, nota: row?.nota ?? "" };
    }
    return map;
  });
  const [refs, setRefs] = useState<RefaccionInput[]>(
    orden.refacciones.length
      ? orden.refacciones.map((r) => ({
          descripcion: r.descripcion,
          cantidad: r.cantidad,
          cajas: r.cajas,
          precio: r.precio,
          iva: r.iva,
          proveedor: r.proveedor ?? "",
          folioFactura: r.folioFactura ?? "",
        }))
      : [emptyRef()],
  );

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
      checklist: CHECKLIST_PUNTOS.map((p) => ({
        clave: p.clave,
        ok: checks[p.clave].ok,
        nota: checks[p.clave].nota || null,
      })),
      refacciones: refs,
    };
  }

  function save(estado?: "abierta" | "en_proceso") {
    setError("");
    setOkMsg("");
    start(async () => {
      try {
        await guardarOrdenTaller(orden.id, { ...payload(), estado });
        setOkMsg("Guardado.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function cerrar() {
    setError("");
    start(async () => {
      try {
        await guardarOrdenTaller(orden.id, payload());
        await cerrarOrdenTaller(orden.id, {
          quienAtendio,
          esPreventivo,
          tipoControlPreventivo: tipoPrev as "km" | "hrs",
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
        </div>
        <Badge variant={orden.estado === "cerrada" ? "success" : orden.estado === "abierta" ? "warning" : "secondary"}>
          {ESTADO_LABEL[orden.estado as EstadoOrden] ?? orden.estado}
        </Badge>
      </div>

      <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
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
      </div>

      <div className="rounded-2xl border p-4 space-y-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <p className="font-semibold text-sm">Checklist de ingreso</p>
        {CHECKLIST_PUNTOS.map((p) => (
          <div key={p.clave} className="flex flex-col sm:flex-row sm:items-center gap-2 py-1.5 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm flex-1">{p.label}</span>
            <div className="flex gap-1">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  disabled={locked}
                  onClick={() => setChecks((c) => ({ ...c, [p.clave]: { ...c[p.clave], ok: c[p.clave].ok === v ? null : v } }))}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border disabled:opacity-60 ${
                    checks[p.clave].ok === v
                      ? v ? "bg-emerald-600 text-white border-emerald-600" : "bg-red-600 text-white border-red-600"
                      : ""
                  }`}
                  style={checks[p.clave].ok !== v ? { borderColor: "var(--border)" } : undefined}
                >
                  {v ? "SI" : "NO"}
                </button>
              ))}
            </div>
            {(p.clave === "neumaticos" || checks[p.clave].nota) && (
              <Input
                disabled={locked}
                className="sm:w-52"
                placeholder="Nota"
                value={checks[p.clave].nota}
                onChange={(e) => setChecks((c) => ({ ...c, [p.clave]: { ...c[p.clave], nota: e.target.value } }))}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">Refacciones</p>
          {!locked && (
            <button type="button" className="text-xs font-semibold flex items-center gap-1" onClick={() => setRefs((r) => [...r, emptyRef()])}>
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          )}
        </div>
        {refs.map((r, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
            <div className="col-span-2">
              <Label>Descripción</Label>
              <Input disabled={locked} value={r.descripcion} onChange={(e) => setRefs((all) => all.map((x, j) => j === i ? { ...x, descripcion: e.target.value } : x))} />
            </div>
            <div>
              <Label>Cant.</Label>
              <Input disabled={locked} type="number" value={r.cantidad ?? ""} onChange={(e) => setRefs((all) => all.map((x, j) => j === i ? { ...x, cantidad: e.target.value ? Number(e.target.value) : null } : x))} />
            </div>
            <div>
              <Label>Precio</Label>
              <Input disabled={locked} type="number" value={r.precio ?? ""} onChange={(e) => setRefs((all) => all.map((x, j) => j === i ? { ...x, precio: e.target.value ? Number(e.target.value) : null } : x))} />
            </div>
            <div>
              <Label>Proveedor</Label>
              <Input disabled={locked} value={r.proveedor ?? ""} onChange={(e) => setRefs((all) => all.map((x, j) => j === i ? { ...x, proveedor: e.target.value } : x))} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs flex items-center gap-1">
                <input type="checkbox" disabled={locked} checked={r.iva !== false} onChange={(e) => setRefs((all) => all.map((x, j) => j === i ? { ...x, iva: e.target.checked } : x))} />
                IVA
              </label>
              {!locked && refs.length > 1 && (
                <button type="button" onClick={() => setRefs((all) => all.filter((_, j) => j !== i))} aria-label="Quitar">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
            <div className="col-span-2 sm:col-span-3">
              <Label>Factura</Label>
              <Input disabled={locked} value={r.folioFactura ?? ""} onChange={(e) => setRefs((all) => all.map((x, j) => j === i ? { ...x, folioFactura: e.target.value } : x))} />
            </div>
          </div>
        ))}
        {total > 0 && (
          <p className="text-sm font-semibold text-right">
            Total {total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
            <span className="text-xs font-normal ml-1" style={{ color: "var(--fg-muted)" }}>(con IVA si aplica)</span>
          </p>
        )}
        <div>
          <Label>Quién atendió</Label>
          <Input disabled={locked} value={quienAtendio} onChange={(e) => setQuienAtendio(e.target.value)} placeholder="Oscar y Carlos" />
        </div>
        {!locked && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={esPreventivo} onChange={(e) => setEsPreventivo(e.target.checked)} className="mt-1" />
            <span>
              Este es el servicio programado (preventivo). Al cerrar se anota en el mantenimiento de la unidad.
              {esPreventivo && (
                <Select className="mt-1 w-28" value={tipoPrev} onChange={(e) => setTipoPrev(e.target.value as "km" | "hrs")}>
                  <option value="km">km</option>
                  <option value="hrs">hrs</option>
                </Select>
              )}
            </span>
          </label>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {okMsg && <p className="text-sm text-emerald-600">{okMsg}</p>}

      {!locked && (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => save()} className="px-4 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)" }}>
            Guardar
          </button>
          <button type="button" disabled={pending} onClick={() => save("en_proceso")} className="px-4 py-2 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)" }}>
            En proceso
          </button>
          {canCerrar && (
            <button type="button" disabled={pending} onClick={cerrar} className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white">
              Cerrar orden
            </button>
          )}
          {canCerrar && (
            <button type="button" disabled={pending} onClick={cancelar} className="px-4 py-2 rounded-xl text-sm text-red-500">
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
