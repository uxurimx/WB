"use client";

import { useState, useTransition } from "react";
import { PlusCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createObra, toggleObraActiva } from "@/app/actions/catalogo";

type Obra = {
  id: number;
  nombre: string;
  cliente: string | null;
  activo: boolean;
  fechaInicio: string | null;
  fechaFin: string | null;
};

export default function ObrasTable({ obras }: { obras: Obra[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ nombre: "", cliente: "", fechaInicio: "" });
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
    startTransition(async () => {
      try {
        await createObra({
          nombre: form.nombre.trim(),
          cliente: form.cliente.trim() || undefined,
          fechaInicio: form.fechaInicio || undefined,
        });
        setForm({ nombre: "", cliente: "", fechaInicio: "" });
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
          {showForm ? "Cancelar" : "Nueva Obra"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>Nueva Obra</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Incasa, Roble..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente">Cliente</Label>
              <Input id="cliente" name="cliente" value={form.cliente} onChange={handleChange}
                placeholder="Nombre del cliente" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaInicio">Fecha inicio</Label>
              <Input id="fechaInicio" name="fechaInicio" type="date" value={form.fechaInicio}
                onChange={handleChange} />
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
              <TableHead>Obra</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {obras.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10" style={{ color: "var(--fg-muted)" }}>
                  Sin obras registradas.
                </TableCell>
              </TableRow>
            )}
            {obras.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium text-sm">{o.nombre}</TableCell>
                <TableCell className="text-sm" style={{ color: "var(--fg-muted)" }}>{o.cliente ?? "—"}</TableCell>
                <TableCell className="text-sm font-mono" style={{ color: "var(--fg-muted)" }}>
                  {o.fechaInicio ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={o.activo ? "success" : "secondary"}>
                    {o.activo ? "Activa" : "Terminada"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button onClick={() => startTransition(() => toggleObraActiva(o.id, !o.activo))}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                    {o.activo
                      ? <XCircle className="w-4 h-4 text-red-400" />
                      : <CheckCircle className="w-4 h-4 text-emerald-400" />}
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
