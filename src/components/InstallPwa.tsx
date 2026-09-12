"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as { standalone?: boolean }).standalone)
  );
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

export default function InstallPwa() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIosHint(isIosSafari());
    setDismissed(sessionStorage.getItem("pwa-install-dismissed") === "1");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed || (!deferred && !iosHint)) return null;

  function hide() {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  return (
    <div
      className="rounded-xl border px-2.5 py-2 space-y-1.5"
      style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-[11px] font-semibold leading-snug" style={{ color: "var(--fg)" }}>
          Instalar app
        </p>
        <button type="button" onClick={hide} className="p-0.5 rounded hover:bg-black/10" aria-label="Cerrar">
          <X className="w-3 h-3" style={{ color: "var(--fg-muted)" }} />
        </button>
      </div>
      {deferred ? (
        <Button type="button" size="sm" className="w-full" onClick={install}>
          <Download className="w-3.5 h-3.5" />
          Añadir a pantalla
        </Button>
      ) : (
        <p className="text-[10px] leading-snug" style={{ color: "var(--fg-muted)" }}>
          En iPhone: <Share className="w-3 h-3 inline -mt-0.5" /> Compartir → <strong>Añadir a pantalla de inicio</strong>
        </p>
      )}
    </div>
  );
}
