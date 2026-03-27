"use client";

import { useState, useTransition } from "react";
import { PlusCircle, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createOperador, toggleOperadorActivo } from "@/app/actions/catalogo";

type Operador = {
  id: number;
  nombre: string;
  tipo: string;
  telefono: string | null;
  activo: boolean;
};

const TIPO_LABELS: Record<string, string> = {
  chofer: "Chofer",
  maquinista: "Maquinista",
  taller: "Taller",
};

export default function OperadoresTable({ operadores }: { operadores: Operador[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ nombre: "", tipo: "chofer", telefono: "" });
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
    startTransition(async () => {
      try {
        await createOperador({
          nombre: form.nombre.trim(),
          tipo: form.tipo,
          telefono: form.telefono.trim() || undefined,
        });
        setForm({ nombre: "", tipo: "chofer", telefono: "" });
        setShowForm(false);
      } catch {
        setError("Error al guardar");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant={showForm ? "secondary" : "default"} size="sm" onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="w-4 h-4" />
          {showForm ? "Cancelar" : "Nuevo Operador"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>Nuevo Operador</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Juan Pérez" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select id="tipo" name="tipo" value={form.tipo} onChange={handleChange}>
                <option value="chofer">Chofer</option>
                <option value="maquinista">Maquinista</option>
                <option value="taller">Taller</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={form.telefono} onChange={handleChange}
                placeholder="812 345 6789" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {operadores.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10" style={{ color: "var(--fg-muted)" }}>
                  Sin operadores registrados.
                </TableCell>
              </TableRow>
            )}
            {operadores.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium text-sm">{o.nombre}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{TIPO_LABELS[o.tipo] ?? o.tipo}</Badge>
                </TableCell>
                <TableCell className="text-sm" style={{ color: "var(--fg-muted)" }}>
                  {o.telefono ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={o.activo ? "success" : "secondary"}>
                    {o.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button onClick={() => startTransition(() => toggleOperadorActivo(o.id, !o.activo))}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                    {o.activo
                      ? <PowerOff className="w-4 h-4 text-red-400" />
                      : <Power className="w-4 h-4 text-emerald-400" />}
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
