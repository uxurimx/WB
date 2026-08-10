"use client";

import { useState, useTransition } from "react";
import { Clock3, Truck, Wrench } from "lucide-react";
import { setMantenimientoConfigGlobal } from "@/app/actions/setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  tipoUnidadLabel,
  type ConfigMantenimientoGlobal,
  type TipoControlMantenimiento,
  type TipoUnidadMantenimiento,
} from "@/lib/mantenimiento-config";

type Props = {
  initialConfig: ConfigMantenimientoGlobal;
};

const TIPOS_VISIBLES_CONFIG: TipoUnidadMantenimiento[] = ["camion", "maquina"];

function tipoUnidadIcon(tipo: TipoUnidadMantenimiento) {
  if (tipo === "maquina") return Wrench;
  return Truck;
}

function controlLabel(tipo: TipoControlMantenimiento) {
  return tipo === "km" ? "km" : "horas";
}

export default function MantenimientoConfig({ initialConfig }: Props) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<ConfigMantenimientoGlobal>(initialConfig);

  function updateTipo(
    tipoUnidad: TipoUnidadMantenimiento,
    key: "tipoControl" | "intervalo" | "activo",
    value: string | boolean,
  ) {
    setConfig((prev) => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        [tipoUnidad]: {
          ...prev.defaults[tipoUnidad],
          [key]: key === "intervalo" ? Number(value) : value,
        },
      },
    }));
  }

  function updateUmbral(
    tipoControl: TipoControlMantenimiento,
    key: "proximo" | "cercano" | "inminente",
    value: string,
  ) {
    setConfig((prev) => ({
      ...prev,
      alertas: {
        ...prev.alertas,
        [tipoControl]: {
          ...prev.alertas[tipoControl],
          [key]: Number(value),
        },
      },
    }));
  }

  function handleSave() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await setMantenimientoConfigGlobal(config);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>
            Intervalos de servicio por tipo de unidad
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
            Define la regla general. Si una unidad tiene un ajuste manual propio, esa unidad respetará su propia configuración.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {TIPOS_VISIBLES_CONFIG.map((tipoUnidad) => {
            const row = config.defaults[tipoUnidad];
            const Icon = tipoUnidadIcon(tipoUnidad);
            return (
              <div
                key={tipoUnidad}
                className="rounded-2xl border p-4 space-y-3"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                    <Icon className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>
                      {tipoUnidadLabel(tipoUnidad)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      Ciclo general de mantenimiento
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_132px] gap-3">
                  <div>
                    <Label htmlFor={`${tipoUnidad}-intervalo`}>Cada</Label>
                    <Input
                      id={`${tipoUnidad}-intervalo`}
                      type="number"
                      min="1"
                      step="1"
                      disabled={pending}
                      value={row.intervalo}
                      onChange={(e) => updateTipo(tipoUnidad, "intervalo", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${tipoUnidad}-control`}>Medición</Label>
                    <select
                      id={`${tipoUnidad}-control`}
                      disabled={pending}
                      value={row.tipoControl}
                      onChange={(e) => updateTipo(tipoUnidad, "tipoControl", e.target.value)}
                      className="w-full h-10 rounded-md border px-3 text-sm"
                      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
                    >
                      <option value="km">km</option>
                      <option value="hrs">horas</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm" style={{ color: "var(--fg)" }}>
                  <input
                    type="checkbox"
                    className="rounded border"
                    checked={row.activo}
                    disabled={pending}
                    onChange={(e) => updateTipo(tipoUnidad, "activo", e.target.checked)}
                  />
                  Regla activa
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-amber-500" />
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>
              Umbrales de alerta
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
              Define desde qué punto el sistema empieza a avisar y cuándo la alerta se vuelve más urgente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {(["km", "hrs"] as TipoControlMantenimiento[]).map((tipoControl) => {
            const row = config.alertas[tipoControl];
            return (
              <div
                key={tipoControl}
                className="rounded-2xl border p-4 space-y-3"
                style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  Unidades medidas en {controlLabel(tipoControl)}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`${tipoControl}-proximo`} className="text-[11px] uppercase tracking-wider">
                      Próximo
                    </Label>
                    <Input
                      id={`${tipoControl}-proximo`}
                      type="number"
                      min="0"
                      step="1"
                      disabled={pending}
                      value={row.proximo}
                      onChange={(e) => updateUmbral(tipoControl, "proximo", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${tipoControl}-cercano`} className="text-[11px] uppercase tracking-wider">
                      Cercano
                    </Label>
                    <Input
                      id={`${tipoControl}-cercano`}
                      type="number"
                      min="0"
                      step="1"
                      disabled={pending}
                      value={row.cercano}
                      onChange={(e) => updateUmbral(tipoControl, "cercano", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${tipoControl}-inminente`} className="text-[11px] uppercase tracking-wider">
                      Inminente
                    </Label>
                    <Input
                      id={`${tipoControl}-inminente`}
                      type="number"
                      min="0"
                      step="1"
                      disabled={pending}
                      value={row.inminente}
                      onChange={(e) => updateUmbral(tipoControl, "inminente", e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Debajo de <span className="font-semibold" style={{ color: "var(--fg)" }}>&quot;Inminente&quot;</span> la unidad seguirá en alerta y al pasar del límite quedará como vencida.
                </p>
              </div>
            );
          })}
        </div>

        {(error || saved) && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: error ? "rgb(239 68 68 / 0.25)" : "rgb(16 185 129 / 0.25)",
              backgroundColor: error ? "rgb(239 68 68 / 0.06)" : "rgb(16 185 129 / 0.06)",
              color: error ? "rgb(220 38 38)" : "rgb(5 150 105)",
            }}
          >
            {error || "Configuración guardada."}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending ? "Guardando..." : saved ? "Guardado" : "Guardar configuración"}
          </Button>
        </div>
      </div>
    </div>
  );
}
