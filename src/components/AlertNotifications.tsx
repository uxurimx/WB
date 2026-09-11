"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribePush } from "@/app/actions/push";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function showLocal(title: string, body: string, tag: string, url: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  });
  n.onclick = () => {
    window.focus();
    if (url) window.location.href = url;
    n.close();
  };
}

export default function AlertNotifications() {
  const [status, setStatus] = useState<"denied" | "on" | "off">(() => {
    if (typeof Notification === "undefined") return "off";
    if (Notification.permission === "granted") return "on";
    if (Notification.permission === "denied") return "denied";
    return "off";
  });
  const pusherRef = useRef<InstanceType<typeof import("pusher-js").default> | null>(null);

  useEffect(() => {
    if (status !== "on") return;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;
    let cancelled = false;

    import("pusher-js").then(({ default: Pusher }) => {
      if (cancelled || pusherRef.current) return;
      const client = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" });
      pusherRef.current = client;
      const ch = client.subscribe("private-alertas");
      ch.bind("nueva-alerta", (data: { title?: string; body?: string; tag?: string; url?: string }) => {
        if (!data?.title) return;
        showLocal(data.title, data.body ?? "", data.tag ?? "wb-alerta", data.url ?? "/overview");
      });
    });

    return () => {
      cancelled = true;
      if (pusherRef.current) {
        pusherRef.current.unsubscribe("private-alertas");
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [status]);

  async function enable() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setStatus("denied");
      return;
    }
    setStatus("on");

    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        });
      }
      const json = sub.toJSON();
      if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
        await subscribePush({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        });
      }
    } catch {
      // permiso local alcanza; push puede fallar en iOS no instalado
    }
  }

  if (status === "on") return null;
  if (status === "denied") {
    return (
      <p className="text-[10px] leading-snug px-1" style={{ color: "var(--fg-muted)" }}>
        Avisos bloqueados en el navegador. Actívalos en ajustes del sitio.
      </p>
    );
  }

  return (
    <Button type="button" size="sm" variant="secondary" className="w-full" onClick={enable}>
      <Bell className="w-3.5 h-3.5" />
      Activar avisos
    </Button>
  );
}
