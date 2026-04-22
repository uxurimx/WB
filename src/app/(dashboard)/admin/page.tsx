import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Shield, Users } from "lucide-react";
import { getUsuarios } from "@/app/actions/admin";
import UsuariosTable from "@/components/admin/UsuariosTable";
import RolesTab from "@/components/admin/RolesTab";
import AdminTabsClient from "@/components/admin/AdminTabsClient";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  if (clerkUser?.publicMetadata?.role !== "admin") redirect("/overview");

  const usuariosList = await getUsuarios();
  const activos = usuariosList.filter((u) => u.activo).length;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Shield className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Sistema
          </p>
        </div>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Administración
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Gestión de acceso y roles. Solo visible para administradores.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { label: "Usuarios activos", value: activos, icon: Users },
          { label: "Total usuarios", value: usuariosList.length, icon: Shield },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-4 rounded-2xl border text-center"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="font-outfit font-bold text-2xl" style={{ color: "var(--fg)" }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <AdminTabsClient
        usuariosTab={
          <UsuariosTable initialUsuarios={usuariosList} currentUserId={userId} />
        }
        rolesTab={
          <RolesTab
            usuarios={usuariosList.map((u) => ({ id: u.id, name: u.name, role: u.role }))}
          />
        }
      />
    </div>
  );
}
