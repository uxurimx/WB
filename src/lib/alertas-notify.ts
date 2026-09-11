import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";
import { UMBRAL_NISSAN, UMBRAL_TALLER } from "@/lib/alertas-config";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AlertaPush = {
  tipo: "stock_bajo" | "sobrecarga";
  title: string;
  body: string;
  url: string;
  tag: string;
};

function umbralDe(nombre: string): number {
  if (nombre.toUpperCase().includes("NISSAN")) return UMBRAL_NISSAN;
  return UMBRAL_TALLER;
}

export async function enviarAlerta(alerta: AlertaPush) {
  await pusherServer.trigger(CHANNELS.alertas, EVENTS.nuevaAlerta, alerta).catch(() => {});
  await enviarWebPush(alerta).catch(() => {});
}

async function enviarWebPush(alerta: AlertaPush) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  const subs = await db.select().from(pushSubscriptions);
  if (subs.length === 0) return;

  const mod = await import("web-push");
  const webpush = (mod.default ?? mod) as typeof import("web-push");
  webpush.setVapidDetails("mailto:avisos@wbconstruccion.mx", publicKey, privateKey);

  const payload = JSON.stringify(alerta);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint));
        }
      }
    }),
  );
}

export async function maybeNotifyStockBajo(opts: {
  nombre: string;
  litrosAntes: number;
  litrosAhora: number;
}) {
  const umbral = umbralDe(opts.nombre);
  if (!(opts.litrosAntes >= umbral && opts.litrosAhora < umbral)) return;
  await enviarAlerta({
    tipo: "stock_bajo",
    title: `${opts.nombre} — stock bajo`,
    body: `Quedan ${Math.round(opts.litrosAhora).toLocaleString("es-MX")} L (umbral ${umbral.toLocaleString("es-MX")} L). Transfiere o recarga.`,
    url: "/tanques",
    tag: `stock-${opts.nombre}`,
  });
}
