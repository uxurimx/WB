"use client";

import { useEffect, useRef, useState } from "react";
import { Fuel, Truck, AlertTriangle } from "lucide-react";
import RecargaTanqueModal from "./RecargaTanqueModal";
import TransferirNissanModal from "./TransferirNissanModal";
import EditarTanqueModal, { type TanqueInfo } from "./EditarTanqueModal";

type StockData = {
  id: number;
  nombre: string;
  litros: number;
  max: number;
  cuentalitros: number;
  ajustePorcentaje: number;
  ultimaActualizacion: string | null;
};

function StockBar({
  litros,
  max,
  color,
  alerta,
}: {
  litros: number;
  max: number;
  color: string;
  alerta: boolean;
}) {
  const pct = Math.min(100, max > 0 ? (litros / max) * 100 : 0);
  return (
    <div className="h-2 rounded-full w-full mt-3" style={{ backgroundColor: "var(--surface-2)" }}>
      <div
        className={`h-2 rounded-full transition-all duration-700 ${alerta ? "bg-red-500" : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function StockCards({
  initialTaller,
  initialNissan,
}: {
  initialTaller: StockData;
  initialNissan: StockData;
}) {
  const [taller, setTaller] = useState<StockData>(initialTaller);
  const [nissan, setNissan] = useState<StockData>(initialNissan);

  // Sync cuando el servidor refresca con nuevos datos (router.refresh)
  // Solo si el valor cambia para no pisar actualizaciones de Pusher innecesariamente
  useEffect(() => {
    setTaller((prev) =>
      prev.litros === initialTaller.litros && prev.cuentalitros === initialTaller.cuentalitros
        ? prev
        : initialTaller
    );
  }, [initialTaller.litros, initialTaller.cuentalitros, initialTaller.id]);

  useEffect(() => {
    setNissan((prev) =>
      prev.litros === initialNissan.litros && prev.cuentalitros === initialNissan.cuentalitros
        ? prev
        : initialNissan
    );
  }, [initialNissan.litros, initialNissan.cuentalitros, initialNissan.id]);

  // Pusher real-time — cliente almacenado en ref para cleanup correcto
  const pusherRef = useRef<InstanceType<typeof import("pusher-js").default> | null>(null);

  useEffect(() => {
    const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    // Flag sincrónico: si el cleanup corre antes de que el import termine, no conectar
    let cancelled = false;

    import("pusher-js").then(({ default: Pusher }) => {
      if (cancelled || pusherRef.current) return;

      const client = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" });
      pusherRef.current = client;

      const channel = client.subscribe("private-stock");
      channel.bind(
        "stock-actualizado",
        (data: { tanque: string; litrosActuales: number; cuentalitros?: number }) => {
          if (data.tanque === "Taller") {
            setTaller((prev) => ({
              ...prev,
              litros: data.litrosActuales,
              ...(data.cuentalitros !== undefined && { cuentalitros: data.cuentalitros }),
            }));
          } else if (data.tanque === "NISSAN") {
            setNissan((prev) => ({
              ...prev,
              litros: data.litrosActuales,
              ...(data.cuentalitros !== undefined && { cuentalitros: data.cuentalitros }),
            }));
          }
        }
      );
    });

    // Cleanup REAL de React — fuera del .then() para que funcione siempre
    return () => {
      cancelled = true;
      if (pusherRef.current) {
        pusherRef.current.unsubscribe("private-stock");
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, []);

  const alertaTaller = taller.litros < 500;
  const alertaNissan = nissan.litros < 100;
  const pctTaller = taller.max > 0 ? Math.round((taller.litros / taller.max) * 100) : 0;
  const pctNissan = nissan.max > 0 ? Math.round((nissan.litros / nissan.max) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Tanque Taller */}
      <div
        className="p-5 rounded-2xl border"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: alertaTaller ? "rgb(239 68 68 / 0.4)" : "var(--border)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Fuel className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
              Stock Taller
            </span>
          </div>
          <div className="flex items-center gap-2">
            {alertaTaller && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
            <EditarTanqueModal tanque={taller as TanqueInfo} />
            <RecargaTanqueModal tanqueId={taller.id} cuentalitrosActual={taller.cuentalitros} />
          </div>
        </div>

        <p className="font-outfit font-bold text-3xl mt-2" style={{ color: alertaTaller ? "rgb(239 68 68)" : "var(--fg)" }}>
          {taller.litros.toLocaleString()}
          <span className="text-base font-normal ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
        </p>

        <StockBar litros={taller.litros} max={taller.max} color="bg-indigo-500" alerta={alertaTaller} />

        <p className="text-xs mt-2" style={{ color: "var(--fg-muted)" }}>
          {pctTaller}% de {taller.max.toLocaleString()} L
          {alertaTaller && <span className="ml-2 text-red-500 font-semibold">Stock bajo</span>}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
          Cuentalitros:{" "}
          <span className="font-mono font-semibold" style={{ color: "var(--fg)" }}>
            {taller.cuentalitros > 0 ? taller.cuentalitros.toLocaleString() : "—"}
          </span>
        </p>
      </div>

      {/* Tanque NISSAN */}
      <div
        className="p-5 rounded-2xl border"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: alertaNissan ? "rgb(239 68 68 / 0.4)" : "var(--border)",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Truck className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
              NISSAN
            </span>
          </div>
          <div className="flex items-center gap-2">
            {alertaNissan && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
            <EditarTanqueModal tanque={nissan as TanqueInfo} />
            <TransferirNissanModal
              tanqueOrigenId={taller.id}
              tanqueDestinoId={nissan.id}
              litrosDisponibles={taller.litros}
              onTransferComplete={(origenLitros, destinoLitros, origenCuentalitros) => {
                setTaller((prev) => ({ ...prev, litros: origenLitros, cuentalitros: origenCuentalitros }));
                setNissan((prev) => ({ ...prev, litros: destinoLitros }));
              }}
            />
          </div>
        </div>

        <p className="font-outfit font-bold text-3xl mt-2" style={{ color: alertaNissan ? "rgb(239 68 68)" : "var(--fg)" }}>
          {nissan.litros.toLocaleString()}
          <span className="text-base font-normal ml-1" style={{ color: "var(--fg-muted)" }}>
            / {nissan.max.toLocaleString()} L
          </span>
        </p>

        <StockBar litros={nissan.litros} max={nissan.max} color="bg-violet-500" alerta={alertaNissan} />

        <p className="text-xs mt-2" style={{ color: "var(--fg-muted)" }}>
          {pctNissan}% de capacidad
          {alertaNissan && <span className="ml-2 text-red-500 font-semibold">Stock bajo</span>}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
          Cuentalitros:{" "}
          <span className="font-mono font-semibold" style={{ color: "var(--fg)" }}>
            {nissan.cuentalitros > 0 ? nissan.cuentalitros.toLocaleString() : "—"}
          </span>
        </p>
      </div>
    </div>
  );
}
