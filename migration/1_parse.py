#!/usr/bin/env python3
"""
WB Diesel Control — Paso 1: Parsear Excel histórico
Lee RESUMEN TALLER del xlsm y genera:
  wb_preview.json   → todas las filas con status ok/pendiente
  wb_pendientes.csv → solo pendientes, para revisión del cliente

Uso:
  python3 1_parse.py
"""
import zipfile
import xml.etree.ElementTree as ET
import datetime
import json
import csv
import sys
from pathlib import Path
from collections import defaultdict

# ── Rutas ──────────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).parent.parent
EXCEL     = ROOT / "DIESEL NISSAN Y TALLER 04 al 10  de ABRIL DE  2026 v1.xlsm"
OUT_DIR   = Path(__file__).parent
PREVIEW   = OUT_DIR / "wb_preview.json"
PENDIENTES = OUT_DIR / "wb_pendientes.csv"

# ── Configuración ──────────────────────────────────────────────────────────────
FECHA_MIN    = datetime.date(2023, 1, 1)   # importar desde este año
FECHA_MAX    = datetime.date(2026, 12, 31)
LITROS_MIN   = 1
LITROS_MAX   = 3000   # más de 3000 L en una sola carga patio es sospechoso

# Hoja RESUMEN TALLER (verificado contra workbook.xml.rels)
SHEET_PATH = "xl/worksheets/sheet2.xml"

NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

MESES_ES = [
    "enero","febrero","marzo","abril","mayo","junio",
    "julio","agosto","septiembre","octubre","noviembre","diciembre",
]


# ── Helpers de lectura ─────────────────────────────────────────────────────────

def load_shared_strings(zf):
    tree = ET.parse(zf.open("xl/sharedStrings.xml"))
    shared = []
    for si in tree.findall(".//x:si", NS):
        texts = [t.text or "" for t in si.findall(".//x:t", NS)]
        shared.append("".join(texts))
    return shared


def read_sheet(zf, sheet_path, shared):
    """Devuelve lista de (row_num, {col_letter: value}) con celdas no vacías."""
    tree = ET.parse(zf.open(sheet_path))
    result = []
    for row_el in tree.findall(".//x:row", NS):
        row_num = int(row_el.get("r", 0))
        cells = {}
        for c in row_el.findall("x:c", NS):
            ref   = c.get("r", "")
            col   = "".join(ch for ch in ref if ch.isalpha())
            t     = c.get("t", "")
            v_el  = c.find("x:v", NS)
            if v_el is None or not v_el.text:
                continue
            cells[col] = shared[int(v_el.text)] if t == "s" else v_el.text
        if cells:
            result.append((row_num, cells))
    return result


# ── Conversiones ───────────────────────────────────────────────────────────────

def xl_to_date(serial_str):
    """Convierte número serial de Excel a datetime.date. Devuelve None si inválido."""
    try:
        n = float(serial_str)
        if n < 1:
            return None
        return datetime.date(1899, 12, 30) + datetime.timedelta(days=int(n))
    except Exception:
        return None


def to_float(s):
    try:
        return float(str(s).replace(",", ""))
    except Exception:
        return None


# ── Lógica de dominio ──────────────────────────────────────────────────────────

def guess_tipo(codigo):
    """Infiere el tipo de unidad a partir del código."""
    c = codigo.upper().strip()
    if c.startswith("CA") and c[2:].isdigit():  return "camion"
    if c.startswith("CR") and c[2:].isdigit():  return "camion"
    if c.startswith("EX") and c[2:].isdigit():  return "maquina"
    if c.startswith("R0") and c[2:].isdigit():  return "maquina"
    if c.startswith("R02") or c.startswith("R03"): return "maquina"
    if "BOBCAT"  in c: return "maquina"
    if "RODILLO" in c or "BOMAG" in c or "HAM ED" in c: return "maquina"
    if "PLANTA"  in c or "GENERADOR" in c: return "otro"
    if c == "NISSAN" or c.startswith("NISSAN"): return "nissan"
    if "HILUX"   in c or "RANGER" in c: return "otro"
    return "otro"


def calc_periodo(fecha):
    """
    Calcula el período (sábado→viernes) que contiene 'fecha'.
    Replica la lógica de getOrCreatePeriodoActual() en periodos.ts.

    JS getDay(): Dom=0, Lun=1, … Sab=6
    Python weekday(): Lun=0, … Sab=5, Dom=6
    """
    js_day = (fecha.weekday() + 1) % 7        # Mon=1 … Sat=6, Sun=0
    dias_atras = 0 if js_day == 6 else js_day + 1
    sabado  = fecha - datetime.timedelta(days=dias_atras)
    viernes = sabado + datetime.timedelta(days=6)

    ini_label = f"{sabado.day} de {MESES_ES[sabado.month - 1]}"
    fin_label  = f"{viernes.day} de {MESES_ES[viernes.month - 1]} de {viernes.year}"
    nombre    = f"{ini_label} al {fin_label}"

    return sabado.isoformat(), viernes.isoformat(), nombre


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    if not EXCEL.exists():
        print(f"ERROR: No se encontró el archivo:\n  {EXCEL}")
        sys.exit(1)

    OUT_DIR.mkdir(exist_ok=True)
    print(f"Leyendo → {EXCEL.name}")

    with zipfile.ZipFile(EXCEL) as zf:
        shared = load_shared_strings(zf)
        raw_rows = read_sheet(zf, SHEET_PATH, shared)

    # Descartar fila de encabezados
    data_rows = [(rn, cells) for rn, cells in raw_rows if cells.get("A", "") != "FECHA"]
    print(f"  {len(data_rows)} filas de datos en RESUMEN TALLER")

    records = []
    stats = defaultdict(int)

    for row_num, cells in data_rows:

        rec = {
            # ── Control ────────────────────────────────────────────────────────
            "id":           f"RT-{row_num}",
            "fuente":       "RESUMEN_TALLER",
            "fila_excel":   row_num,
            "status":       "ok",
            "motivo":       None,
            "importado_at": None,
            "db_id":        None,
            # ── Datos del negocio ──────────────────────────────────────────────
            "fecha":           None,
            "folio_excel":     None,
            "operador_nombre": None,
            "unidad_codigo":   None,
            "unidad_tipo":     None,
            "litros":          None,
            "odometro_hrs":    None,
            "cuenta_lt_inicio":None,
            "cuenta_lt_fin":   None,
            # ── Período calculado ──────────────────────────────────────────────
            "periodo_inicio": None,
            "periodo_fin":    None,
            "periodo_nombre": None,
        }

        motivos = []

        # ── A: FECHA ──────────────────────────────────────────────────────────
        fecha = xl_to_date(cells.get("A", ""))
        if fecha is None or not (FECHA_MIN <= fecha <= FECHA_MAX):
            motivos.append("FECHA_INVALIDA")
        else:
            rec["fecha"] = fecha.isoformat()
            pi, pf, pn = calc_periodo(fecha)
            rec["periodo_inicio"] = pi
            rec["periodo_fin"]    = pf
            rec["periodo_nombre"] = pn

        # ── B: FOLIO ─────────────────────────────────────────────────────────
        folio_raw = cells.get("B", "")
        folio_val = to_float(folio_raw)
        if folio_val is not None and folio_val > 0:
            rec["folio_excel"] = int(folio_val)
        elif folio_raw.strip():
            motivos.append("FOLIO_INVALIDO")

        # ── C: RESP (despachador en taller) ───────────────────────────────────
        resp = cells.get("C", "").strip()
        if resp:
            rec["operador_nombre"] = resp

        # ── D: UNIDAD ─────────────────────────────────────────────────────────
        unidad = cells.get("D", "").strip()
        if not unidad:
            motivos.append("UNIDAD_VACIA")
        else:
            rec["unidad_codigo"] = unidad
            rec["unidad_tipo"]   = guess_tipo(unidad)

        # ── E: LITROS ─────────────────────────────────────────────────────────
        litros = to_float(cells.get("E", ""))
        if litros is None or litros < LITROS_MIN:
            motivos.append("LITROS_INVALIDOS")
        elif litros > LITROS_MAX:
            motivos.append("LITROS_EXCESIVOS")
        else:
            rec["litros"] = litros

        # ── F: KMS/HRS (odómetro) ────────────────────────────────────────────
        odo = to_float(cells.get("F", ""))
        if odo is not None and odo > 0:
            rec["odometro_hrs"] = odo

        # ── G: CUENTALITROS INICIO ───────────────────────────────────────────
        cl_ini = to_float(cells.get("G", ""))
        if cl_ini is not None and cl_ini > 0:
            rec["cuenta_lt_inicio"] = cl_ini

        # ── H: CUENTALITROS FIN ──────────────────────────────────────────────
        cl_fin = to_float(cells.get("H", ""))
        if cl_fin is not None and cl_fin > 0:
            rec["cuenta_lt_fin"] = cl_fin

        # ── Validación cruzada ────────────────────────────────────────────────
        if rec["cuenta_lt_inicio"] and rec["cuenta_lt_fin"]:
            if rec["cuenta_lt_fin"] < rec["cuenta_lt_inicio"]:
                motivos.append("CUENTALITROS_INVERTIDO")

        # ── Status final ──────────────────────────────────────────────────────
        if motivos:
            rec["status"] = "pendiente"
            rec["motivo"] = ", ".join(motivos)
            stats["pendiente"] += 1
        else:
            stats["ok"] += 1

        records.append(rec)

    # ── Escribir wb_preview.json ──────────────────────────────────────────────
    with open(PREVIEW, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    # ── Escribir wb_pendientes.csv ────────────────────────────────────────────
    pendientes = [r for r in records if r["status"] == "pendiente"]

    with open(PENDIENTES, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "FILA_EXCEL", "MOTIVO", "FECHA", "FOLIO",
            "UNIDAD", "LITROS", "ODOMETRO", "OPERADOR",
            "CUENTALT_INI", "CUENTALT_FIN",
            "DECISION",   # cliente llena: IMPORTAR | IGNORAR | CORREGIR:CA05
        ])
        for r in pendientes:
            writer.writerow([
                r["fila_excel"],
                r["motivo"],
                r["fecha"]            or "",
                r["folio_excel"]      or "",
                r["unidad_codigo"]    or "",
                r["litros"]           or "",
                r["odometro_hrs"]     or "",
                r["operador_nombre"]  or "",
                r["cuenta_lt_inicio"] or "",
                r["cuenta_lt_fin"]    or "",
                "",
            ])

    # ── Resumen ───────────────────────────────────────────────────────────────
    # Desglose de motivos
    motivo_count = defaultdict(int)
    for r in pendientes:
        for m in (r["motivo"] or "").split(", "):
            if m:
                motivo_count[m] += 1

    print(f"""
╔══════════════════════════════════════════╗
║         RESUMEN DE PARSEO                ║
╠══════════════════════════════════════════╣
║  Total filas analizadas : {len(records):>6}           ║
║  ✓ Listas para importar : {stats['ok']:>6}           ║
║  ⚠ Pendientes           : {stats['pendiente']:>6}           ║
╚══════════════════════════════════════════╝""")

    if motivo_count:
        print("\n  Motivos de pendiente:")
        for motivo, cnt in sorted(motivo_count.items(), key=lambda x: -x[1]):
            print(f"    {motivo:<30} {cnt:>5} filas")

    print(f"""
  Archivos generados:
    → {PREVIEW.name}
    → {PENDIENTES.name}

  Siguientes pasos:
    1. Revisa wb_pendientes.csv en Excel, llena columna DECISION
    2. python3 2_import.py --dry-run
    3. python3 2_import.py --clean --commit
""")


if __name__ == "__main__":
    main()
