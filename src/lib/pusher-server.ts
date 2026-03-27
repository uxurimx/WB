import Pusher from "pusher";

if (
  !process.env.PUSHER_APP_ID ||
  !process.env.NEXT_PUBLIC_PUSHER_KEY ||
  !process.env.PUSHER_SECRET ||
  !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
) {
  throw new Error("Missing Pusher server environment variables");
}

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

// ─── Channel names (centralizados para evitar typos) ──────────
export const CHANNELS = {
  stock: "private-stock",        // actualizaciones de stock diesel
  cargas: "private-cargas",      // nueva carga registrada
  alertas: "private-alertas",    // alertas del sistema
} as const;

// ─── Event names ──────────────────────────────────────────────
export const EVENTS = {
  stockActualizado: "stock-actualizado",
  nuevaCarga: "nueva-carga",
  nuevaAlerta: "nueva-alerta",
} as const;
