"use client";

import { useState, useTransition, useRef } from "react";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle,
  AlertTriangle, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { importarCargas, type ImportRow, type ImportResult } from "@/app/actions/import";

// ── Excel parsing helpers ─────────────────────────────────────

function excelSerialToDateStr(serial: number): string {
  // Excel serial: days since 1900-01-01 (with leap year bug)
  const d = new Date((serial - 25569) * 86400 * 1000);
  return d.toISOString().split("T")[0];
}

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "number") return excelSerialToDateStr(val);
  if (typeof val === "string") {
    // Try ISO or common formats
    const iso = Date.parse(val);
    if (!isNaN(iso)) return new Date(iso).toISOString().split("T")[0];
    // DD/MM/YYYY
    const m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const y = m[3].length === 2 ? `20${m[3]}` : m[3];
      return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    }
  }
  return null;
}

function parseNum(val: unknown): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
  return isNaN(n) ? undefined : n;
}

function parseOrigen(val: unknown): "patio" | "campo" {
  const s = String(val ?? "").toLowerCase();
  if (s.includes("campo") || s.includes("nissan") || s.includes("externo")) return "campo";
  return "patio";
}

function parseTipoDiesel(val: unknown): string {
  const s = String(val ?? "").toLowerCase();
  if (s.includes("amigo") || s.includes("verde")) return "amigo";
  if (s.includes("oxxo") || s.includes("rojo")) return "oxxogas";
  return "normal";
}

function detectCol(headers: unknown[], terms: string[]): number {
  const lower = headers.map((h) => String(h ?? "").toLowerCase().trim());
  for (const term of terms) {
    const idx = lower.findIndex((h) => h.includes(term));
    if (idx !== -1) return idx;
  }
  return -1;
}

type ColMap = {
  fecha: number; folio: number; unidad: number; operador: number;
  litros: number; origen: number; tipoDiesel: number;
  obra: number; odometro: number; hora: number;
};

function detectColMap(headers: unknown[]): ColMap {
  return {
    fecha:      detectCol(headers, ["fecha", "date", "día", "dia"]),
    folio:      detectCol(headers, ["folio", "no.", "núm", "num", "ticket"]),
    unidad:     detectCol(headers, ["unidad", "camion", "camión", "equipo", "vehículo", "vehiculo", "cod"]),
    operador:   detectCol(headers, ["operador", "chofer", "conductor", "piloto", "operador"]),
    litros:     detectCol(headers, ["litro", "lts", "lt ", "combustible", "diesel"]),
    origen:     detectCol(headers, ["origen", "tipo carga", "fuente", "lugar"]),
    tipoDiesel: detectCol(headers, ["tipo diesel", "tipo de diesel", "calidad", "amigo", "oxxo"]),
    obra:       detectCol(headers, ["obra", "proyecto", "trabajo", "job"]),
    odometro:   detectCol(headers, ["odometro", "odómetro", "km", "hrs", "horas", "horómetro", "horometro"]),
    hora:       detectCol(headers, ["hora", "time", "hh", "h:"]),
  };
}

// ── Component ─────────────────────────────────────────────────

type Step = "idle" | "preview" | "importing" | "done";

type ParsedData = {
  sheetName: string;
  headers: unknown[];
  dataRows: unknown[][];
  colMap: ColMap;
};

export default function ImportarExcel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("idle");
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState("");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setStep("idle");
    setParsed(null);
    setImportResult(null);
    setParseError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");

    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      // Try to find CARGAS GENERAL sheet, otherwise use first sheet
      const sheetName =
        wb.SheetNames.find((n) => n.toUpperCase().includes("CARGAS GENERAL")) ??
        wb.SheetNames.find((n) => n.toUpperCase().includes("CARGAS")) ??
        wb.SheetNames[0];

      const ws = wb.Sheets[sheetName];
      const rawData: unknown[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
        raw: true,
      }) as unknown[][];

      // Find header row (first non-empty row with meaningful content)
      let headerIdx = 0;
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        if (row && row.filter((c) => c !== "").length >= 4) {
          headerIdx = i;
          break;
        }
      }

      const headers = rawData[headerIdx] ?? [];
      const dataRows = rawData.slice(headerIdx + 1).filter(
        (r) => r && r.some((c) => c !== "" && c !== null)
      );

      const colMap = detectColMap(headers);

      if (colMap.unidad === -1 || colMap.litros === -1 || colMap.fecha === -1) {
        setParseError(
          `No se detectaron columnas esenciales. Hoja: "${sheetName}". ` +
          `Asegúrate de que el archivo tiene columnas Fecha, Unidad y Litros.`
        );
        return;
      }

      setParsed({ sheetName, headers, dataRows, colMap });
      setStep("preview");
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Error al leer el archivo"
      );
    }
  }

  function buildImportRows(data: ParsedData): ImportRow[] {
    const { dataRows, colMap } = data;
    const rows: ImportRow[] = [];

    for (const row of dataRows) {
      const fecha = parseDate(row[colMap.fecha]);
      const litros = parseNum(row[colMap.litros]);
      const unidadCodigo = String(row[colMap.unidad] ?? "").trim().toUpperCase();

      if (!fecha || !litros || !unidadCodigo) continue;

      rows.push({
        fecha,
        hora: colMap.hora !== -1 ? (String(row[colMap.hora] ?? "").slice(0, 5) || undefined) : undefined,
        folio: colMap.folio !== -1 ? parseNum(row[colMap.folio]) : undefined,
        unidadCodigo,
        operadorNombre: colMap.operador !== -1 ? (String(row[colMap.operador] ?? "").trim() || undefined) : undefined,
        obraNombre: colMap.obra !== -1 ? (String(row[colMap.obra] ?? "").trim() || undefined) : undefined,
        litros,
        origen: colMap.origen !== -1 ? parseOrigen(row[colMap.origen]) : "patio",
        tipoDiesel: colMap.tipoDiesel !== -1 ? parseTipoDiesel(row[colMap.tipoDiesel]) : "normal",
        odometroHrs: colMap.odometro !== -1 ? parseNum(row[colMap.odometro]) : undefined,
      });
    }
    return rows;
  }

  function handleImport() {
    if (!parsed) return;
    const rows = buildImportRows(parsed);
    setStep("importing");

    startTransition(async () => {
      try {
        const result = await importarCargas(rows);
        setImportResult(result);
        setStep("done");
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "Error al importar");
        setStep("preview");
      }
    });
  }

  // ── Render ────────────────────────────────────────────────

  if (step === "idle") {
    return (
      <div
        className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer hover:border-indigo-500/50 transition-colors"
        style={{ borderColor: "var(--border)" }}
        onClick={() => fileRef.current?.click()}
      >
        <FileSpreadsheet className="w-10 h-10 mx-auto mb-4 text-indigo-500/60" />
        <p className="font-semibold text-sm mb-1" style={{ color: "var(--fg)" }}>
          Selecciona un archivo Excel (.xlsx)
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--fg-muted)" }}>
          Debe contener una hoja "CARGAS GENERAL" con columnas Fecha, Unidad y Litros.
        </p>
        <Button type="button" size="sm" variant="secondary">
          <Upload className="w-4 h-4" /> Elegir archivo
        </Button>
        {parseError && (
          <p className="mt-4 text-sm text-red-500 flex items-center gap-1.5 justify-center">
            <AlertCircle className="w-4 h-4 shrink-0" /> {parseError}
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    );
  }

  if (step === "preview" && parsed) {
    const previewRows = parsed.dataRows.slice(0, 10);
    const importRows = buildImportRows(parsed);

    return (
      <div className="space-y-5">
        {/* File info */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <FileSpreadsheet className="w-5 h-5 text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              Hoja: {parsed.sheetName}
            </p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              {parsed.dataRows.length} filas detectadas · {importRows.length} válidas para importar
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Column detection summary */}
        <div
          className="p-4 rounded-xl border"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-muted)" }}>
            Columnas detectadas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: "Fecha", idx: parsed.colMap.fecha },
              { label: "Folio", idx: parsed.colMap.folio },
              { label: "Unidad", idx: parsed.colMap.unidad },
              { label: "Operador", idx: parsed.colMap.operador },
              { label: "Litros", idx: parsed.colMap.litros },
              { label: "Origen", idx: parsed.colMap.origen },
              { label: "Odómetro", idx: parsed.colMap.odometro },
              { label: "Obra", idx: parsed.colMap.obra },
            ].map(({ label, idx }) => (
              <div key={label} className="flex items-center gap-1.5">
                {idx !== -1 ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {label}
                </span>
                {idx !== -1 && (
                  <span className="text-xs font-mono truncate" style={{ color: "var(--fg)" }}>
                    → "{String(parsed.headers[idx] ?? "").slice(0, 20)}"
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview table */}
        <div className="rounded-xl border overflow-auto" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr style={{ backgroundColor: "var(--surface-2)" }}>
                {["Fecha", "Unidad", "Litros", "Origen", "Operador", "Odóm."].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold uppercase tracking-wider"
                    style={{ color: "var(--fg-muted)", borderBottom: "1px solid var(--border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ backgroundColor: "var(--surface)" }}>
              {buildImportRows({ ...parsed, dataRows: previewRows }).map((r, i) => (
                <tr
                  key={i}
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
                >
                  <td className="px-3 py-1.5 font-mono" style={{ color: "var(--fg)" }}>{r.fecha}</td>
                  <td className="px-3 py-1.5 font-mono font-bold" style={{ color: "var(--fg)" }}>{r.unidadCodigo}</td>
                  <td className="px-3 py-1.5 font-mono text-right" style={{ color: "var(--fg)" }}>{r.litros} L</td>
                  <td className="px-3 py-1.5" style={{ color: "var(--fg-muted)" }}>{r.origen}</td>
                  <td className="px-3 py-1.5 truncate max-w-[120px]" style={{ color: "var(--fg-muted)" }}>{r.operadorNombre ?? "—"}</td>
                  <td className="px-3 py-1.5 font-mono" style={{ color: "var(--fg-muted)" }}>{r.odometroHrs ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsed.dataRows.length > 10 && (
            <p
              className="px-3 py-2 text-xs border-t"
              style={{ borderColor: "var(--border)", color: "var(--fg-muted)", backgroundColor: "var(--surface-2)" }}
            >
              Mostrando 10 de {importRows.length} filas válidas
            </p>
          )}
        </div>

        {parseError && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" /> {parseError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleImport}
            disabled={importRows.length === 0}
          >
            <ChevronRight className="w-4 h-4" />
            Importar {importRows.length} cargas
          </Button>
        </div>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div
        className="p-10 rounded-2xl border text-center"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
          Importando datos históricos...
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
          Creando períodos, unidades y registrando cargas. Puede tardar unos segundos.
        </p>
      </div>
    );
  }

  if (step === "done" && importResult) {
    return (
      <div className="space-y-4">
        {/* Result summary */}
        <div
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
            <p className="font-semibold" style={{ color: "var(--fg)" }}>
              Importación completada
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Importadas", value: importResult.importadas, color: "text-emerald-500" },
              { label: "Omitidas (dup.)", value: importResult.omitidas, color: "var(--fg-muted)" },
              { label: "Unidades nuevas", value: importResult.creadasUnidades, color: "var(--fg-muted)" },
              { label: "Errores", value: importResult.errores.length, color: importResult.errores.length > 0 ? "text-red-500" : "var(--fg-muted)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`font-outfit font-bold text-2xl ${typeof color === "string" && color.startsWith("text-") ? color : ""}`}
                   style={typeof color === "string" && !color.startsWith("text-") ? { color } : undefined}>
                  {value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Errors */}
        {importResult.errores.length > 0 && (
          <div
            className="p-4 rounded-xl border max-h-48 overflow-y-auto"
            style={{ backgroundColor: "var(--surface)", borderColor: "rgb(239 68 68 / 0.3)" }}
          >
            <p className="text-xs font-semibold mb-2 text-red-500">
              Filas con error ({importResult.errores.length})
            </p>
            <ul className="space-y-1">
              {importResult.errores.map((e, i) => (
                <li key={i} className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Fila {e.fila}: {e.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button type="button" variant="secondary" size="sm" onClick={reset}>
          Importar otro archivo
        </Button>
      </div>
    );
  }

  return null;
}
