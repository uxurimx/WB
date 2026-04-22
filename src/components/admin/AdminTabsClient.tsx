"use client";

import { useState } from "react";
import { Users, Shield } from "lucide-react";

type Tab = "usuarios" | "roles";

export default function AdminTabsClient({
  usuariosTab,
  rolesTab,
}: {
  usuariosTab: React.ReactNode;
  rolesTab: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("usuarios");

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "usuarios", label: "Usuarios", icon: Users },
    { key: "roles",    label: "Roles y Permisos", icon: Shield },
  ];

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl border w-fit"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? "bg-indigo-600 text-white shadow-md"
                : "hover:bg-[var(--surface-2)]"
            }`}
            style={tab !== key ? { color: "var(--fg-muted)" } : undefined}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "usuarios" && usuariosTab}
      {tab === "roles"    && rolesTab}
    </div>
  );
}
