"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type PusherClient from "pusher-js";
import Link from "next/link";
import { ArrowUpCircle, ArrowLeftRight, ClipboardList, Clock, ExternalLink, Fuel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  createdAt: string | null;
};

type RecargaFeed = {
  id: number;
  fecha: string;
  litros: number;
  tanqueNombre: string;
  proveedor: string | null;
  folioFactura: string | null;
  createdAt: string | null;
};

type TransferenciaFeed = {
  id: number;
  fecha: string;
  litros: number;
  folio: number | null;
  origenNombre: string;
  destinoNombre: string;
  createdAt: string | null;
};

const ORIGEN_VARIANT: Record<string, "default" | "warning"> = {
  patio: "default",
  campo: "warning",
};

type FeedFilter = "todas" | "cargas" | "tanques";

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatFechaHora(fecha: string, createdAt: string | null, hora?: string | null) {
  if (createdAt) {
    return new Date(createdAt).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return `${formatFecha(fecha)}${hora ? ` · ${hora.slice(0, 5)}` : ""}`;
}

export default function CargasRecientes({
  initialCargas,
  recargasRecientes = [],
  transferenciasRecientes = [],
}: {
  initialCargas: Carga[];
  recargasRecientes?: RecargaFeed[];
  transferenciasRecientes?: TransferenciaFeed[];
}) {
  const router = useRouter();
  const pusherRef = useRef<PusherClient | null>(null);
  const [filter, setFilter] = useState<FeedFilter>("todas");
  const [selected, setSelected] = useState<FeedItem | null>(null);

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

      const chStock = client.subscribe("private-stock");
      chStock.bind("stock-actualizado", () => { router.refresh(); });
    });

    return () => {
      cancelled = true;
      if (pusherRef.current) {
        pusherRef.current.unsubscribe("private-cargas");
        pusherRef.current.unsubscribe("private-stock");
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [router]);

  // Construir feed mixto ordenado por fecha desc
  type FeedItem =
    | { _tipo: "carga"; key: string; fecha: string; createdAt: string | null; data: Carga }
    | { _tipo: "recarga"; key: string; fecha: string; createdAt: string | null; data: RecargaFeed }
    | { _tipo: "transferencia"; key: string; fecha: string; createdAt: string | null; data: TransferenciaFeed };

  const feed: FeedItem[] = [
    ...initialCargas.map((c) => ({
      _tipo: "carga" as const,
      key: `c_${c.id}`,
      fecha: c.fecha,
      createdAt: c.createdAt,
      data: c,
    })),
    ...recargasRecientes.map((r) => ({
      _tipo: "recarga" as const,
      key: `r_${r.id}`,
      fecha: r.fecha,
      createdAt: r.createdAt,
      data: r,
    })),
    ...transferenciasRecientes.map((t) => ({
      _tipo: "transferencia" as const,
      key: `t_${t.id}`,
      fecha: t.fecha,
      createdAt: t.createdAt,
      data: t,
    })),
  ]
    .sort((a, b) => {
      const dateA = a.createdAt ?? (a.fecha + "T23:59:59");
      const dateB = b.createdAt ?? (b.fecha + "T23:59:59");
      return dateB.localeCompare(dateA);
    });
  const visibleFeed = feed.filter((item) => {
    if (filter === "cargas") return item._tipo === "carga";
    if (filter === "tanques") return item._tipo !== "carga";
    return true;
  }).slice(0, 15);

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <div
        className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--fg)" }}
        >
          Actividad reciente
        </h2>
        <div className="flex items-center gap-2">
          {([
            ["todas", "Todas"],
            ["cargas", "Cargas"],
            ["tanques", "Tanques"],
          ] as [FeedFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                filter === key ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-[var(--surface-2)]"
              }`}
              style={filter !== key ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}
            >
              {label}
            </button>
          ))}
          <Link
            href="/cargas?tab=actividad"
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors ml-1"
          >
            Ver movimientos →
          </Link>
        </div>
      </div>

      {visibleFeed.length === 0 ? (
        <div
          className="p-8 text-center"
          style={{ backgroundColor: "var(--surface)", color: "var(--fg-muted)" }}
        >
          <p className="text-sm">Sin actividad registrada.</p>
          <Link
            href="/cargas/nueva"
            className="text-sm font-semibold text-indigo-500 hover:text-indigo-400 mt-2 inline-block"
          >
            Registrar primera carga →
          </Link>
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--surface)" }}>
          {visibleFeed.map((item, i) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelected(item)}
              className="w-full text-left px-5 py-3 flex items-center gap-4 hover:bg-[var(--surface-2)] transition-colors"
              style={{
                borderTop: i > 0 ? `1px solid var(--border)` : undefined,
              }}
            >
              {item._tipo === "carga" && <CargaRow carga={item.data} />}
              {item._tipo === "recarga" && <RecargaRow recarga={item.data} />}
              {item._tipo === "transferencia" && <TransferenciaRow transf={item.data} />}
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de movimiento</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="rounded-xl border p-3" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--fg-muted)" }}>
                  {selected._tipo === "carga" ? "Carga" : selected._tipo === "recarga" ? "Recarga de tanque" : "Transferencia"}
                </p>
                <p className="font-mono font-bold text-lg" style={{ color: "var(--fg)" }}>
                  {selected._tipo === "carga"
                    ? selected.data.folio != null ? `${selected.data.origen === "campo" ? "C" : "P"}-${selected.data.folio}` : "—"
                    : selected._tipo === "recarga"
                    ? selected.data.folioFactura ?? "Sin factura"
                    : selected.data.folio ? `T-${selected.data.folio}` : "Sin folio"}
                </p>
                <p className="text-xs flex items-center gap-1 mt-1" style={{ color: "var(--fg-muted)" }}>
                  <Clock className="w-3 h-3" />
                  {formatFechaHora(selected.fecha, selected.createdAt, selected._tipo === "carga" ? selected.data.hora : null)}
                </p>
              </div>

              {selected._tipo === "carga" && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Unidad" value={selected.data.unidad?.codigo ?? "—"} />
                  <Info label="Operador" value={selected.data.operador?.nombre ?? "—"} />
                  <Info label="Origen" value={selected.data.origen === "campo" ? "Campo" : "Patio"} />
                  <Info label="Litros" value={`${selected.data.litros.toLocaleString()} L`} mono />
                </div>
              )}
              {selected._tipo === "recarga" && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Tanque" value={selected.data.tanqueNombre} />
                  <Info label="Proveedor" value={selected.data.proveedor ?? "—"} />
                  <Info label="Litros" value={`+${selected.data.litros.toLocaleString()} L`} mono />
                  <Info label="Factura" value={selected.data.folioFactura ?? "—"} mono />
                </div>
              )}
              {selected._tipo === "transferencia" && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Origen" value={selected.data.origenNombre} />
                  <Info label="Destino" value={selected.data.destinoNombre} />
                  <Info label="Litros" value={`${selected.data.litros.toLocaleString()} L`} mono />
                  <Info label="Folio" value={selected.data.folio ? `T-${selected.data.folio}` : "—"} mono />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={selected?._tipo === "carga" ? `/cargas?tab=actividad&desde=${selected.fecha}&hasta=${selected.fecha}` : "/tanques"}>
                {selected?._tipo === "carga" ? "Ver cargas del día" : "Ver tanques"}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/cargas?tab=actividad">Ver movimientos</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{label}</p>
      <p className={mono ? "font-mono font-semibold" : "font-semibold"} style={{ color: "var(--fg)" }}>{value}</p>
    </div>
  );
}

function CargaRow({ carga: c }: { carga: Carga }) {
  const Icon = c.origen === "campo" ? Fuel : ClipboardList;
  const iconColor = c.origen === "campo" ? "text-amber-500" : "text-indigo-400";

  return (
    <>
      <div className="shrink-0 p-1.5 rounded-lg" style={{ backgroundColor: "rgb(99 102 241 / 0.1)" }}>
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
      <div className="w-20 shrink-0">
        <p className="font-mono text-sm font-bold" style={{ color: "var(--fg)" }}>
          {c.folio != null ? `${c.origen === "campo" ? "C" : "P"}-${c.folio}` : "—"}
        </p>
        <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
          {formatFechaHora(c.fecha, c.createdAt, c.hora)}
        </p>
      </div>
      <p className="font-mono font-bold text-sm w-14 shrink-0" style={{ color: "var(--fg)" }}>
        {c.unidad?.codigo ?? "—"}
      </p>
      <p className="text-sm flex-1 truncate hidden sm:block" style={{ color: "var(--fg-muted)" }}>
        {c.operador?.nombre ?? "—"}
      </p>
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <Badge variant={ORIGEN_VARIANT[c.origen] ?? "secondary"}>
          {c.origen === "campo" ? "Campo" : "Patio"}
        </Badge>
        {c.tipoDiesel && c.tipoDiesel !== "normal" && (
          <Badge variant={c.tipoDiesel === "amigo" ? "success" : "danger"}>
            {c.tipoDiesel === "amigo" ? "Amigo" : "OxxoGas"}
          </Badge>
        )}
      </div>
      <p className="font-mono font-semibold text-sm w-16 text-right shrink-0" style={{ color: "var(--fg)" }}>
        {c.litros.toLocaleString()}
        <span className="text-xs font-normal ml-0.5" style={{ color: "var(--fg-muted)" }}>L</span>
      </p>
    </>
  );
}

function RecargaRow({ recarga: r }: { recarga: RecargaFeed }) {
  return (
    <>
      <div className="shrink-0 p-1.5 rounded-lg" style={{ backgroundColor: "rgb(16 185 129 / 0.1)" }}>
        <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
      </div>
      <div className="w-20 shrink-0">
        <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Recarga</p>
        <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{formatFechaHora(r.fecha, r.createdAt)}</p>
      </div>
      <p className="text-sm flex-1 truncate" style={{ color: "var(--fg-muted)" }}>
        {r.tanqueNombre}{r.proveedor ? ` · ${r.proveedor}` : ""}
      </p>
      <Badge variant="secondary">Pipa</Badge>
      <p className="font-mono font-semibold text-sm w-16 text-right shrink-0 text-emerald-500">
        +{r.litros.toLocaleString()}
        <span className="text-xs font-normal ml-0.5" style={{ color: "var(--fg-muted)" }}>L</span>
      </p>
    </>
  );
}

function TransferenciaRow({ transf: t }: { transf: TransferenciaFeed }) {
  return (
    <>
      <div className="shrink-0 p-1.5 rounded-lg" style={{ backgroundColor: "rgb(99 102 241 / 0.1)" }}>
        <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
      </div>
      <div className="w-20 shrink-0">
        <p className="font-mono text-sm font-bold" style={{ color: "var(--fg)" }}>
          {t.folio ? `T-${t.folio}` : "—"}
        </p>
        <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{formatFechaHora(t.fecha, t.createdAt)}</p>
      </div>
      <p className="text-sm flex-1 truncate" style={{ color: "var(--fg-muted)" }}>
        {t.origenNombre} → {t.destinoNombre}
      </p>
      <Badge variant="secondary">Transfer.</Badge>
      <p className="font-mono font-semibold text-sm w-16 text-right shrink-0" style={{ color: "var(--fg)" }}>
        {t.litros.toLocaleString()}
        <span className="text-xs font-normal ml-0.5" style={{ color: "var(--fg-muted)" }}>L</span>
      </p>
    </>
  );
}
