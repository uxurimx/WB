"use client";

import { useEffect, useRef, useState } from "react";
import { Fuel, Wrench, BarChart3 } from "lucide-react";

export default function DashboardKpis({
  initialCargasHoy,
  initialLitrosHoy,
  initialUnidadesActivas,
}: {
  initialCargasHoy: number;
  initialLitrosHoy: number;
  initialUnidadesActivas: number;
}) {
  const [cargasHoy, setCargasHoy]   = useState(initialCargasHoy);
  const [litrosHoy, setLitrosHoy]   = useState(initialLitrosHoy);
  const unidadesActivas             = initialUnidadesActivas;
  const channelRef = useRef<{ unbind_all: () => void } | null>(null);

  useEffect(() => {
    const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    import("pusher-js").then(({ default: Pusher }) => {
      const client = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" });
      const ch = client.subscribe("private-cargas");
      channelRef.current = ch;

      ch.bind("nueva-carga", (data: { litros: number }) => {
        setCargasHoy((p) => p + 1);
        setLitrosHoy((p) => p + (data.litros ?? 0));
      });
    });

    return () => { channelRef.current?.unbind_all(); };
  }, []);

  const items = [
    {
      label: "Cargas Hoy",
      value: cargasHoy,
      unit: "eventos",
      icon: Wrench,
    },
    {
      label: "Litros Hoy",
      value: litrosHoy.toLocaleString(),
      unit: "despachados",
      icon: Fuel,
    },
    {
      label: "Período actual",
      value: unidadesActivas,
      unit: "unidades activas",
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
      {items.map(({ label, value, unit, icon: Icon }) => (
        <div
          key={label}
          className="p-4 rounded-2xl border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--fg-muted)" }}
            >
              {label}
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Icon className="w-3.5 h-3.5 text-indigo-500" />
            </div>
          </div>
          <p className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
            {value}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{unit}</p>
        </div>
      ))}
    </div>
  );
}
