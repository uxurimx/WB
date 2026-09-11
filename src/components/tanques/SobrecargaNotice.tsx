import { AlertTriangle } from "lucide-react";
import { etiquetaMotivo, TEXTO_SOBRECARGA, type MotivoSobrecarga } from "@/lib/tanque-sobrecarga";

export default function SobrecargaNotice({
  litros,
  capacidadMax,
  exceso,
  motivo,
  detalle,
  compact = false,
}: {
  litros: number;
  capacidadMax: number;
  exceso: number;
  motivo?: MotivoSobrecarga | null;
  detalle?: string | null;
  compact?: boolean;
}) {
  const titulo = compact
    ? `Sobrecarga +${Math.round(exceso).toLocaleString("es-MX")} L`
    : `${Math.round(litros).toLocaleString("es-MX")} L · ${Math.round(exceso).toLocaleString("es-MX")} L sobre ${Math.round(capacidadMax).toLocaleString("es-MX")} L`;

  return (
    <div
      className="mt-2 rounded-xl border px-3 py-2"
      style={{
        backgroundColor: "rgb(245 158 11 / 0.08)",
        borderColor: "rgb(245 158 11 / 0.35)",
      }}
    >
      <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        {titulo}
      </p>
      {motivo && (
        <p className="text-[11px] font-semibold mt-0.5 text-amber-700/80">
          {etiquetaMotivo(motivo)}
        </p>
      )}
      <p className="text-[11px] mt-1 leading-snug" style={{ color: "var(--fg-muted)" }}>
        {detalle || TEXTO_SOBRECARGA}
      </p>
    </div>
  );
}
