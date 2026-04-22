"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Check, X, Shield, Users } from "lucide-react";
import type { NavPermission } from "@/lib/permissions";
import { updateRolePerms, createRole, deleteRole } from "@/app/actions/admin";

const PERMISOS: { key: NavPermission; label: string; desc: string }[] = [
  { key: "cargas.historial",   label: "Ver Historial",        desc: "Accede al historial de cargas" },
  { key: "cargas.nueva_patio", label: "Carga Patio",          desc: "Registra cargas desde el tanque principal" },
  { key: "cargas.nueva_campo", label: "Carga Campo",          desc: "Registra cargas desde el tanque NISSAN" },
  { key: "catalogo",           label: "Catálogos",            desc: "Gestiona unidades, operadores y obras" },
  { key: "periodos",           label: "Períodos / Análisis",  desc: "Accede a análisis por período" },
  { key: "admin",              label: "Administración",        desc: "Panel de administración del sistema" },
];

type RolData = {
  id: string;
  label: string;
  permisos: NavPermission[];
  isSystem: boolean;
};

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "hover:bg-[var(--surface-2)]"
      }`}
      style={!active ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}
    >
      {children}
    </button>
  );
}

export default function RolesTab({
  initialRoles,
  usuarios,
}: {
  initialRoles: RolData[];
  usuarios: { id: string; name: string; role: string }[];
}) {
  const [rolesList, setRolesList] = useState<RolData[]>(initialRoles);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Nuevo rol form
  const [showNew, setShowNew] = useState(false);
  const [newId, setNewId]     = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newPerms, setNewPerms] = useState<NavPermission[]>([]);
  const [newError, setNewError] = useState("");

  function togglePerm(roleId: string, perm: NavPermission) {
    const rol = rolesList.find((r) => r.id === roleId);
    if (!rol) return;
    const newPermisos = rol.permisos.includes(perm)
      ? rol.permisos.filter((p) => p !== perm)
      : [...rol.permisos, perm];

    setRolesList((prev) =>
      prev.map((r) => r.id === roleId ? { ...r, permisos: newPermisos } : r)
    );

    startTransition(async () => {
      try {
        await updateRolePerms(roleId, newPermisos);
        setError("");
      } catch {
        setRolesList((prev) =>
          prev.map((r) => r.id === roleId ? { ...r, permisos: rol.permisos } : r)
        );
        setError("Error al guardar permisos");
      }
    });
  }

  function toggleNewPerm(perm: NavPermission) {
    setNewPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  function handleCreateRole() {
    setNewError("");
    const id = newId.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!id)         { setNewError("El ID es requerido"); return; }
    if (!newLabel.trim()) { setNewError("El nombre es requerido"); return; }
    if (rolesList.some((r) => r.id === id)) { setNewError("Ya existe un rol con ese ID"); return; }

    startTransition(async () => {
      try {
        await createRole({ id, label: newLabel.trim(), permisos: newPerms });
        setRolesList((prev) => [
          ...prev,
          { id, label: newLabel.trim(), permisos: newPerms, isSystem: false },
        ]);
        setNewId(""); setNewLabel(""); setNewPerms([]); setShowNew(false);
        setNewError("");
      } catch (err) {
        setNewError(err instanceof Error ? err.message : "Error al crear");
      }
    });
  }

  function handleDeleteRole(roleId: string) {
    const prev = rolesList;
    setRolesList((p) => p.filter((r) => r.id !== roleId));
    startTransition(async () => {
      try {
        await deleteRole(roleId);
        setError("");
      } catch (err) {
        setRolesList(prev);
        setError(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1.5 px-1">
          <X className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      {/* ─── Matriz permisos ─── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Permisos por rol
          </h2>
          <button
            type="button"
            onClick={() => { setShowNew((v) => !v); setNewError(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Rol
          </button>
        </div>

        {/* Formulario nuevo rol */}
        {showNew && (
          <div
            className="mb-4 p-5 rounded-2xl border space-y-4"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Crear nuevo rol</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                  ID del rol <span className="opacity-60">(ej: supervisor)</span>
                </label>
                <input
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="supervisor"
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                  style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Nombre visible</label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Supervisor de Campo"
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/30"
                  style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Permisos</label>
              <div className="flex flex-wrap gap-2">
                {PERMISOS.map(({ key, label }) => (
                  <FilterChip
                    key={key}
                    active={newPerms.includes(key)}
                    onClick={() => toggleNewPerm(key)}
                  >
                    {label}
                  </FilterChip>
                ))}
              </div>
            </div>

            {newError && <p className="text-xs text-red-500">{newError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateRole}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60"
              >
                {isPending ? "Guardando..." : "Crear Rol"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNew(false); setNewId(""); setNewLabel(""); setNewPerms([]); setNewError(""); }}
                className="px-4 py-2 rounded-xl text-sm hover:bg-[var(--surface-2)] transition-colors"
                style={{ color: "var(--fg-muted)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Tabla de permisos editable */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-44"
                    style={{ color: "var(--fg-muted)" }}>
                    Permiso
                  </th>
                  {rolesList.map((r) => (
                    <th key={r.id} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--fg-muted)" }}>
                      <div className="flex flex-col items-center gap-1">
                        <span>{r.label}</span>
                        {!r.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(r.id)}
                            disabled={isPending}
                            className="p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                            title={`Eliminar rol ${r.label}`}
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        )}
                        {r.isSystem && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10"
                            style={{ color: "var(--fg-muted)" }}>
                            sistema
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISOS.map(({ key, label, desc }, i) => (
                  <tr
                    key={key}
                    className={i < PERMISOS.length - 1 ? "border-b" : ""}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-xs" style={{ color: "var(--fg)" }}>{label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{desc}</p>
                    </td>
                    {rolesList.map((r) => {
                      const tiene = r.permisos.includes(key);
                      return (
                        <td key={r.id} className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => togglePerm(r.id, key)}
                            disabled={isPending}
                            title={tiene ? `Quitar "${label}" de ${r.label}` : `Dar "${label}" a ${r.label}`}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all mx-auto ${
                              tiene
                                ? "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30"
                                : "hover:bg-[var(--surface-2)] border border-transparent"
                            } disabled:opacity-50`}
                          >
                            {tiene
                              ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                              : <X className="w-3.5 h-3.5" style={{ color: "var(--fg-muted)", opacity: 0.25 }} />
                            }
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs mt-2 px-1" style={{ color: "var(--fg-muted)" }}>
          Los cambios se guardan automáticamente. Los roles del sistema no pueden eliminarse.
        </p>
      </section>

      {/* ─── Distribución de usuarios ─── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>
          Usuarios por rol
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rolesList.map((r) => {
            const count = usuarios.filter((u) => u.role === r.id).length;
            return (
              <div key={r.id} className="p-4 rounded-2xl border"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-md bg-indigo-500/10">
                    <Shield className="w-3 h-3 text-indigo-500" />
                  </div>
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--fg-muted)" }}>
                    {r.label}
                  </p>
                </div>
                <p className="font-outfit font-bold text-2xl" style={{ color: "var(--fg)" }}>{count}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                  {count === 1 ? "usuario" : "usuarios"}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
