"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Fuel, Wrench, BarChart3 } from "lucide-react";

export default function DashboardKpis({
  initialCargasHoy,
  initialLitrosHoy,
  initialUnidadesActivas,
  fechaHoy,
}: {
  initialCargasHoy: number;
  initialLitrosHoy: number;
  initialUnidadesActivas: number;
  fechaHoy: string;
}) {
  const [cargasHoy, setCargasHoy] = useState(initialCargasHoy);
  const [litrosHoy, setLitrosHoy] = useState(initialLitrosHoy);
  const unidadesActivas           = initialUnidadesActivas;

  // Sync cuando el servidor refresca (router.refresh) — evita que acumulador Pusher
  // quede desincronizado si hay re-mount o los totales del día cambian en DB
  useEffect(() => { setCargasHoy(initialCargasHoy); }, [initialCargasHoy]);
  useEffect(() => { setLitrosHoy(initialLitrosHoy);  }, [initialLitrosHoy]);

  const pusherRef = useRef<InstanceType<typeof import("pusher-js").default> | null>(null);

  useEffect(() => {
    const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    let cancelled = false;

    import("pusher-js").then(({ default: Pusher }) => {
      if (cancelled || pusherRef.current) return;

      const client = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" });
      pusherRef.current = client;

      const ch = client.subscribe("private-cargas");
      ch.bind("nueva-carga", (data: { litros: number }) => {
        setCargasHoy((p) => p + 1);
        setLitrosHoy((p) => p + (data.litros ?? 0));
      });
    });

    // Cleanup REAL fuera del .then()
    return () => {
      cancelled = true;
      if (pusherRef.current) {
        pusherRef.current.unsubscribe("private-cargas");
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  const items = [
    {
      label: "Cargas Hoy",
      value: cargasHoy,
      unit: "eventos",
      hint: "Ver registros de hoy",
      href: `/cargas?desde=${fechaHoy}&hasta=${fechaHoy}`,
      icon: Wrench,
    },
    {
      label: "Litros Hoy",
      value: litrosHoy.toLocaleString(),
      unit: "despachados",
      hint: "Auditar litros del día",
      href: `/cargas?desde=${fechaHoy}&hasta=${fechaHoy}`,
      icon: Fuel,
    },
    {
      label: "Período actual",
      value: unidadesActivas,
      unit: "unidades activas",
      hint: "Abrir período actual",
      href: "/periodos",
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
      {items.map(({ label, value, unit, hint, href, icon: Icon }) => (
        <Link key={label} href={href} className="p-4 rounded-2xl border block transition-colors hover:bg-[var(--surface-2)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
              {label}
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Icon className="w-3.5 h-3.5 text-indigo-500" />
            </div>
          </div>
          <p className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>{value}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{unit}</p>
          <p className="text-[10px] mt-2 text-indigo-400">{hint} →</p>
        </Link>
      ))}
    </div>
  );
}
