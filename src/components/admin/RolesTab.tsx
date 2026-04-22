"use client";

import { ROLE_NAV_PERMISSIONS, type NavPermission } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { Check, X } from "lucide-react";

const PERMISOS: { key: NavPermission; label: string }[] = [
  { key: "cargas.historial",    label: "Ver Historial" },
  { key: "cargas.nueva_patio",  label: "Nueva Carga Patio" },
  { key: "cargas.nueva_campo",  label: "Nueva Carga Campo" },
  { key: "catalogo",            label: "Catálogos" },
  { key: "periodos",            label: "Períodos / Análisis" },
  { key: "admin",               label: "Administración" },
];

type Rol = keyof typeof ROLE_LABELS;

export default function RolesTab({
  usuarios,
}: {
  usuarios: { id: string; name: string; role: string }[];
}) {
  const roles = Object.keys(ROLE_LABELS) as Rol[];

  return (
    <div className="space-y-8">
      {/* Tabla de permisos por rol */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>
          Permisos por rol
        </h2>
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                    Permiso
                  </th>
                  {roles.map((r) => (
                    <th key={r} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISOS.map(({ key, label }) => (
                  <tr key={key} className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 font-medium text-sm" style={{ color: "var(--fg)" }}>
                      {label}
                    </td>
                    {roles.map((r) => {
                      const tiene = (ROLE_NAV_PERMISSIONS[r] ?? []).includes(key);
                      return (
                        <td key={r} className="px-4 py-3 text-center">
                          {tiene
                            ? <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                            : <X className="w-4 h-4 mx-auto" style={{ color: "var(--fg-muted)", opacity: 0.3 }} />
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Usuarios por rol */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>
          Distribución de usuarios
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {roles.map((r) => {
            const count = usuarios.filter((u) => u.role === r).length;
            return (
              <div key={r} className="p-4 rounded-2xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="font-outfit font-bold text-2xl" style={{ color: "var(--fg)" }}>{count}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{ROLE_LABELS[r]}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
