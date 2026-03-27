"use client";

import { useState, useTransition } from "react";
import { MailX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revocarInvitacion } from "@/app/actions/admin";
import { ROLE_LABELS, type Role } from "@/lib/roles";

type Invitacion = {
  id: string;
  emailAddress: string;
  role: string;
  createdAt: number;
};

function fmtFecha(ts: number) {
  return new Date(ts).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RevokeButton({ id, onRevoked }: { id: string; onRevoked: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleRevoke() {
    setError("");
    startTransition(async () => {
      try {
        await revocarInvitacion(id);
        onRevoked();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleRevoke}
        disabled={isPending}
        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
      >
        <MailX className="w-4 h-4" />
        {isPending ? "Revocando..." : "Revocar"}
      </Button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function InvitacionesPendientes({
  initialInvitaciones,
}: {
  initialInvitaciones: Invitacion[];
}) {
  const [invitaciones, setInvitaciones] = useState(initialInvitaciones);

  function handleRevoked(id: string) {
    setInvitaciones((prev) => prev.filter((inv) => inv.id !== id));
  }

  if (invitaciones.length === 0) {
    return (
      <div
        className="p-5 rounded-2xl border text-center"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Sin invitaciones pendientes.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      {invitaciones.map((inv, i) => (
        <div
          key={inv.id}
          className="px-5 py-4 flex items-center gap-4 flex-wrap"
          style={{
            backgroundColor: "var(--surface)",
            borderTop: i > 0 ? "1px solid var(--border)" : undefined,
          }}
        >
          {/* Email */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>
              {inv.emailAddress}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              Enviada el {fmtFecha(inv.createdAt)}
            </p>
          </div>

          {/* Role */}
          <Badge variant="secondary">
            {ROLE_LABELS[inv.role as Role] ?? inv.role}
          </Badge>

          {/* Revoke */}
          <RevokeButton id={inv.id} onRevoked={() => handleRevoked(inv.id)} />
        </div>
      ))}
    </div>
  );
}
