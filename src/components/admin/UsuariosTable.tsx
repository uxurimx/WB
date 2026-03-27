"use client";

import { useState, useTransition } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { updateRolUsuario, toggleActivoUsuario } from "@/app/actions/admin";
import { VALID_ROLES, ROLE_LABELS, type Role } from "@/lib/roles";

type Usuario = {
  id: string;
  name: string;
  email: string;
  role: string;
  activo: boolean;
  createdAt: Date | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-indigo-500/15 text-indigo-500",
  gerente: "bg-violet-500/15 text-violet-500",
  despachador: "bg-emerald-500/15 text-emerald-500",
  operador_nissan: "bg-amber-500/15 text-amber-500",
  encargado_obra: "bg-blue-500/15 text-blue-500",
  chofer: "bg-gray-500/15 text-gray-400",
};

function fmtFecha(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function UserRow({
  user,
  isCurrentUser,
  onRoleChange,
  onToggle,
}: {
  user: Usuario;
  isCurrentUser: boolean;
  onRoleChange: (id: string, role: string) => void;
  onToggle: (id: string) => void;
}) {
  const [pendingRole, startRoleTransition] = useTransition();
  const [pendingToggle, startToggleTransition] = useTransition();
  const [roleError, setRoleError] = useState("");
  const [toggleError, setToggleError] = useState("");

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    setRoleError("");
    startRoleTransition(async () => {
      try {
        await updateRolUsuario(user.id, newRole);
        onRoleChange(user.id, newRole);
      } catch (err) {
        setRoleError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function handleToggle() {
    setToggleError("");
    startToggleTransition(async () => {
      try {
        await toggleActivoUsuario(user.id);
        onToggle(user.id);
      } catch (err) {
        setToggleError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  const avatarColor = ROLE_COLORS[user.role] ?? ROLE_COLORS.chofer;

  return (
    <div
      className={`px-5 py-4 flex items-center gap-4 flex-wrap ${
        !user.activo ? "opacity-50" : ""
      }`}
      style={{ borderTop: "1px solid var(--border)" }}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor}`}
      >
        {initials(user.name)}
      </div>

      {/* Name + email */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>
            {user.name}
          </p>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-[10px] py-0">
              Tú
            </Badge>
          )}
          {!user.activo && (
            <Badge variant="danger" className="text-[10px] py-0">
              Inactivo
            </Badge>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>
          {user.email}
        </p>
        {(roleError || toggleError) && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-3 h-3" />
            {roleError || toggleError}
          </p>
        )}
      </div>

      {/* Joined */}
      <p
        className="text-xs hidden sm:block shrink-0 w-24"
        style={{ color: "var(--fg-muted)" }}
      >
        {fmtFecha(user.createdAt)}
      </p>

      {/* Role select */}
      <div className="shrink-0 flex items-center gap-1.5">
        {pendingRole && (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
        )}
        <Select
          value={user.role}
          onChange={handleRoleChange}
          disabled={isCurrentUser || pendingRole}
          className="text-xs h-8 min-w-[150px]"
        >
          {VALID_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      {/* Toggle activo */}
      <Button
        type="button"
        variant={user.activo ? "secondary" : "ghost"}
        size="sm"
        onClick={handleToggle}
        disabled={isCurrentUser || pendingToggle}
        className={
          !user.activo
            ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
            : "text-red-500 hover:text-red-400 hover:bg-red-500/10"
        }
      >
        {pendingToggle
          ? "..."
          : user.activo
          ? "Desactivar"
          : "Reactivar"}
      </Button>
    </div>
  );
}

export default function UsuariosTable({
  initialUsuarios,
  currentUserId,
}: {
  initialUsuarios: Usuario[];
  currentUserId: string;
}) {
  const [usuarios, setUsuarios] = useState(initialUsuarios);

  function handleRoleChange(id: string, newRole: string) {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  }

  function handleToggle(id: string) {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Header row */}
      <div
        className="px-5 py-3 flex items-center gap-4 border-b"
        style={{
          backgroundColor: "var(--surface-2)",
          borderColor: "var(--border)",
        }}
      >
        <div className="w-9 shrink-0" />
        <p
          className="flex-1 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--fg-muted)" }}
        >
          Usuario
        </p>
        <p
          className="text-xs font-semibold uppercase tracking-wider hidden sm:block w-24 shrink-0"
          style={{ color: "var(--fg-muted)" }}
        >
          Alta
        </p>
        <p
          className="text-xs font-semibold uppercase tracking-wider shrink-0 min-w-[150px]"
          style={{ color: "var(--fg-muted)" }}
        >
          Rol
        </p>
        <p
          className="text-xs font-semibold uppercase tracking-wider shrink-0 w-24"
          style={{ color: "var(--fg-muted)" }}
        >
          Estado
        </p>
      </div>

      {/* Rows */}
      <div style={{ backgroundColor: "var(--surface)" }}>
        {usuarios.length === 0 ? (
          <div
            className="px-5 py-8 text-center text-sm"
            style={{ color: "var(--fg-muted)" }}
          >
            Sin usuarios registrados.
          </div>
        ) : (
          usuarios.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isCurrentUser={u.id === currentUserId}
              onRoleChange={handleRoleChange}
              onToggle={handleToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
