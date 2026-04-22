"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type PusherClient from "pusher-js";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Carga = {
  id: number;
  fecha: string;
  hora: string | null;
  folio: number | null;
  litros: number;
  origen: string;
  tipoDiesel: string | null;
  unidad: { codigo: string } | null;
  operador: { nombre: string } | null;
};

const ORIGEN_VARIANT: Record<string, "default" | "warning"> = {
  patio: "default",
  campo: "warning",
};

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function CargasRecientes({
  initialCargas,
}: {
  initialCargas: Carga[];
}) {
  const router = useRouter();
  const pusherRef = useRef<PusherClient | null>(null);

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
      ch.bind("nueva-carga", () => { router.refresh(); });
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
  }, [router]);

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--fg)" }}
        >
          Cargas recientes
        </h2>
        <Link
          href="/cargas"
          className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
        >
          Ver historial →
        </Link>
      </div>

      {initialCargas.length === 0 ? (
        <div
          className="p-8 text-center"
          style={{ backgroundColor: "var(--surface)", color: "var(--fg-muted)" }}
        >
          <p className="text-sm">Sin cargas registradas.</p>
          <Link
            href="/cargas/nueva"
            className="text-sm font-semibold text-indigo-500 hover:text-indigo-400 mt-2 inline-block"
          >
            Registrar primera carga →
          </Link>
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--surface)" }}>
          {initialCargas.map((c, i) => (
            <div
              key={c.id}
              className="px-5 py-3 flex items-center gap-4"
              style={{
                borderTop: i > 0 ? `1px solid var(--border)` : undefined,
              }}
            >
              {/* Folio + fecha */}
              <div className="w-20 shrink-0">
                <p
                  className="font-mono text-sm font-bold"
                  style={{ color: "var(--fg)" }}
                >
                  {c.folio ?? "—"}
                </p>
                <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
                  {formatFecha(c.fecha)}
                </p>
              </div>

              {/* Unidad */}
              <p
                className="font-mono font-bold text-sm w-14 shrink-0"
                style={{ color: "var(--fg)" }}
              >
                {c.unidad?.codigo ?? "—"}
              </p>

              {/* Operador */}
              <p
                className="text-sm flex-1 truncate hidden sm:block"
                style={{ color: "var(--fg-muted)" }}
              >
                {c.operador?.nombre ?? "—"}
              </p>

              {/* Badges */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <Badge variant={ORIGEN_VARIANT[c.origen] ?? "secondary"}>
                  {c.origen === "campo" ? "Campo" : "Patio"}
                </Badge>
                {c.tipoDiesel && c.tipoDiesel !== "normal" && (
                  <Badge
                    variant={
                      c.tipoDiesel === "amigo" ? "success" : "danger"
                    }
                  >
                    {c.tipoDiesel === "amigo" ? "Amigo" : "OxxoGas"}
                  </Badge>
                )}
              </div>

              {/* Litros */}
              <p
                className="font-mono font-semibold text-sm w-16 text-right shrink-0"
                style={{ color: "var(--fg)" }}
              >
                {c.litros.toLocaleString()}
                <span
                  className="text-xs font-normal ml-0.5"
                  style={{ color: "var(--fg-muted)" }}
                >
                  L
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
