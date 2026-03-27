"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { invitarUsuario } from "@/app/actions/admin";
import { VALID_ROLES, ROLE_LABELS } from "@/lib/roles";

type Status = { ok: boolean; msg: string } | null;

export default function InvitarUsuarioForm() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("despachador");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    startTransition(async () => {
      try {
        await invitarUsuario(email, role);
        setStatus({ ok: true, msg: `Invitación enviada a ${email}` });
        setEmail("");
      } catch (err) {
        setStatus({
          ok: false,
          msg: err instanceof Error ? err.message : "Error al invitar",
        });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 rounded-2xl border space-y-4"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="inv-email">Correo electrónico</Label>
          <Input
            id="inv-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@empresa.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inv-role">Rol</Label>
          <Select
            id="inv-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {VALID_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {status && (
        <div
          className={`flex items-center gap-2 text-sm ${
            status.ok ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {status.ok ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {status.msg}
        </div>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        <Send className="w-4 h-4" />
        {isPending ? "Enviando..." : "Enviar invitación"}
      </Button>
    </form>
  );
}
