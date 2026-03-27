"use client";

import { useState, useTransition } from "react";
import { PlusCircle, Power, PowerOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createUnidad, toggleUnidadActivo } from "@/app/actions/catalogo";

type Unidad = {
  id: number;
  codigo: string;
  nombre: string | null;
  tipo: string;
  modelo: string | null;
  capacidadTanque: number | null;
  rendimientoReferencia: number | null;
  activo: boolean;
};

const TIPO_LABELS: Record<string, string> = {
  camion: "Camión",
  maquina: "Maquinaria",
  nissan: "NISSAN",
  otro: "Otro",
};

const TIPO_VARIANT: Record<string, "default" | "success" | "warning" | "secondary"> = {
  camion: "default",
  maquina: "warning",
  nissan: "success",
  otro: "secondary",
};

export default function UnidadesTable({ unidades }: { unidades: Unidad[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    tipo: "camion",
    modelo: "",
    capacidadTanque: "",
    rendimientoReferencia: "",
  });
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.codigo.trim()) { setError("El código es requerido"); return; }
    if (!form.tipo) { setError("El tipo es requerido"); return; }

    startTransition(async () => {
      try {
        await createUnidad({
          codigo: form.codigo.trim().toUpperCase(),
          nombre: form.nombre.trim() || undefined,
          tipo: form.tipo,
          modelo: form.modelo.trim() || undefined,
          capacidadTanque: form.capacidadTanque ? parseFloat(form.capacidadTanque) : undefined,
          rendimientoReferencia: form.rendimientoReferencia ? parseFloat(form.rendimientoReferencia) : undefined,
        });
        setForm({ codigo: "", nombre: "", tipo: "camion", modelo: "", capacidadTanque: "", rendimientoReferencia: "" });
        setShowForm(false);
      } catch {
        setError("Error al guardar. ¿El código ya existe?");
      }
    });
  }

  function handleToggle(id: number, activo: boolean) {
    startTransition(() => toggleUnidadActivo(id, !activo));
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex justify-end">
        <Button
          variant={showForm ? "secondary" : "default"}
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusCircle className="w-4 h-4" />
          {showForm ? "Cancelar" : "Nueva Unidad"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>
            Nueva Unidad
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" name="codigo" value={form.codigo} onChange={handleChange}
                placeholder="CA12, EX01, R02..." className="uppercase" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select id="tipo" name="tipo" value={form.tipo} onChange={handleChange}>
                <option value="camion">Camión</option>
                <option value="maquina">Maquinaria</option>
                <option value="nissan">NISSAN</option>
                <option value="otro">Otro</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Nombre descriptivo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" name="modelo" value={form.modelo} onChange={handleChange}
                placeholder="Komatsu PC88, CAT 308..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacidadTanque">Cap. Tanque (L)</Label>
              <Input id="capacidadTanque" name="capacidadTanque" type="number" value={form.capacidadTanque}
                onChange={handleChange} placeholder="300" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rendimientoReferencia">
                Rend. Referencia {form.tipo === "maquina" ? "(L/Hr)" : "(km/L)"}
              </Label>
              <Input id="rendimientoReferencia" name="rendimientoReferencia" type="number" step="0.01"
                value={form.rendimientoReferencia} onChange={handleChange} placeholder="2.8" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar Unidad"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead>Código</TableHead>
              <TableHead>Nombre / Modelo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cap. L</TableHead>
              <TableHead className="text-right">Rend. Ref.</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {unidades.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10" style={{ color: "var(--fg-muted)" }}>
                  Sin unidades. Agrega la primera o usa "Seed WB" en Configuración.
                </TableCell>
              </TableRow>
            )}
            {unidades.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <span className="font-mono font-bold text-sm">{u.codigo}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{u.nombre ?? u.codigo}</span>
                  {u.modelo && (
                    <span className="ml-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>
                      · {u.modelo}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={TIPO_VARIANT[u.tipo] ?? "secondary"}>
                    {TIPO_LABELS[u.tipo] ?? u.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {u.capacidadTanque ? `${u.capacidadTanque}` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {u.rendimientoReferencia
                    ? `${u.rendimientoReferencia} ${u.tipo === "maquina" ? "L/Hr" : "km/L"}`
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={u.activo ? "success" : "secondary"}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => handleToggle(u.id, u.activo)}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                    title={u.activo ? "Desactivar" : "Activar"}
                  >
                    {u.activo
                      ? <PowerOff className="w-4 h-4 text-red-400" />
                      : <Power className="w-4 h-4 text-emerald-400" />
                    }
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
