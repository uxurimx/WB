#!/usr/bin/env python3
"""
WB Diesel Control — Paso 2: Importar a Neon DB
Lee wb_preview.json y ejecuta los INSERTs.

Uso:
  python3 2_import.py --dry-run          # Simula, NO toca la DB  (default)
  python3 2_import.py --commit           # Ejecuta los INSERTs
  python3 2_import.py --clean --commit   # Limpia datos de prueba y luego importa
  python3 2_import.py --clean --dry-run  # Muestra qué se limpiaría y cuántos registros

El JSON se actualiza en cada --commit: status "ok" → "importado" + db_id + importado_at.
Puedes correr --commit múltiples veces: los "importado" se saltan automáticamente.
"""
import json
import sys
import os
import datetime
from pathlib import Path

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 no instalado. Ejecuta: pip3 install psycopg2-binary")
    sys.exit(1)

# ── Rutas ──────────────────────────────────────────────────────────────────────
ROOT    = Path(__file__).parent.parent
OUT_DIR = Path(__file__).parent
PREVIEW = OUT_DIR / "wb_preview.json"

# ── Flags ─────────────────────────────────────────────────────────────────────
DRY_RUN     = "--commit" not in sys.argv
CLEAN_FIRST = "--clean"  in sys.argv

# ── Tablas a limpiar (preserva: users, tanques, configuracion, fuentes_diesel) ─
CLEAN_SQL = """
TRUNCATE TABLE
    archivos,
    audit_log,
    cargas,
    rendimientos,
    recargas_tanque,
    transferencias_tanque,
    periodos,
    operadores,
    unidades,
    obras
RESTART IDENTITY CASCADE;
"""


# ── Cargar DATABASE_URL desde .env.local ──────────────────────────────────────

def load_db_url():
    for env_file in [ROOT / ".env.local", ROOT / ".env"]:
        if env_file.exists():
            for line in env_file.read_text().splitlines():
                line = line.strip()
                if line.startswith("DATABASE_URL"):
                    val = line.split("=", 1)[1].strip().strip("'\"")
                    # psycopg2 no soporta channel_binding, quitarlo
                    val = val.replace("&channel_binding=require", "")
                    val = val.replace("?channel_binding=require&", "?")
                    return val
    url = os.environ.get("DATABASE_URL", "")
    if url:
        return url.replace("&channel_binding=require", "")
    print("ERROR: DATABASE_URL no encontrada en .env.local ni en entorno")
    sys.exit(1)


# ── Upserts ───────────────────────────────────────────────────────────────────

def get_or_create_periodo(cur, inicio, fin, nombre):
    """Busca período por fecha_inicio. Si no existe, lo crea."""
    cur.execute(
        "SELECT id FROM periodos WHERE fecha_inicio = %s LIMIT 1",
        (inicio,)
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        """
        INSERT INTO periodos (nombre, fecha_inicio, fecha_fin, cerrado)
        VALUES (%s, %s, %s, false)
        RETURNING id
        """,
        (nombre, inicio, fin),
    )
    return cur.fetchone()[0]


def get_or_create_unidad(cur, codigo, tipo):
    """Upsert por codigo (tiene unique constraint)."""
    cur.execute(
        """
        INSERT INTO unidades (codigo, nombre, tipo)
        VALUES (%s, %s, %s)
        ON CONFLICT (codigo) DO UPDATE SET tipo = EXCLUDED.tipo
        RETURNING id
        """,
        (codigo.upper(), codigo, tipo),
    )
    return cur.fetchone()[0]


def get_or_create_operador(cur, nombre):
    """Busca operador por nombre (case-insensitive). Si no existe, lo crea."""
    nombre = nombre.strip()
    cur.execute(
        "SELECT id FROM operadores WHERE lower(trim(nombre)) = lower(trim(%s)) LIMIT 1",
        (nombre,),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO operadores (nombre) VALUES (%s) RETURNING id",
        (nombre,),
    )
    return cur.fetchone()[0]


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    modo = "DRY-RUN" if DRY_RUN else "COMMIT"
    print(f"WB Import — modo: {modo}{'  +CLEAN' if CLEAN_FIRST else ''}")

    if not PREVIEW.exists():
        print(f"ERROR: {PREVIEW} no encontrado. Ejecuta primero 1_parse.py")
        sys.exit(1)

    with open(PREVIEW, encoding="utf-8") as f:
        records = json.load(f)

    ok_records = [r for r in records if r["status"] == "ok"]
    ya_importados = sum(1 for r in records if r["status"] == "importado")
    pendientes    = sum(1 for r in records if r["status"] == "pendiente")

    print(f"  Total en JSON : {len(records)}")
    print(f"  ✓ ok          : {len(ok_records)}")
    print(f"  ✓ ya importados: {ya_importados}")
    print(f"  ⚠ pendientes  : {pendientes}")

    if not ok_records:
        print("\nNo hay registros nuevos para importar.")
        return

    # ── Conectar a DB ─────────────────────────────────────────────────────────
    db_url = load_db_url()
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        cur = conn.cursor()
        print(f"\n  DB conectada ✓")
    except Exception as e:
        print(f"ERROR conectando a DB: {e}")
        sys.exit(1)

    try:
        # ── Paso 0: Limpiar DB ─────────────────────────────────────────────
        if CLEAN_FIRST:
            if DRY_RUN:
                print("\n  [DRY-RUN] Se ejecutaría:")
                print("  TRUNCATE archivos, audit_log, cargas, rendimientos,")
                print("           recargas_tanque, transferencias_tanque,")
                print("           periodos, operadores, unidades, obras")
                print("  RESTART IDENTITY CASCADE;")
            else:
                print("\n  Limpiando datos de prueba...", end=" ", flush=True)
                cur.execute(CLEAN_SQL)
                conn.commit()
                print("✓")

        # ── Cachés en memoria ──────────────────────────────────────────────
        periodo_cache  = {}   # inicio_str → id
        unidad_cache   = {}   # codigo_upper → id
        operador_cache = {}   # nombre_lower → id

        stats = {"importados": 0, "errores": 0}
        errores_detalle = []

        print(f"\nProcesando {len(ok_records)} registros...")

        for i, rec in enumerate(ok_records, 1):
            if i % 500 == 0 or i == len(ok_records):
                pct = i / len(ok_records) * 100
                print(f"  {i:>5}/{len(ok_records)}  ({pct:.0f}%)", flush=True)

            try:
                # ── Período ────────────────────────────────────────────────
                pi = rec["periodo_inicio"]
                if pi not in periodo_cache:
                    if DRY_RUN:
                        periodo_cache[pi] = -1
                    else:
                        periodo_cache[pi] = get_or_create_periodo(
                            cur, pi, rec["periodo_fin"], rec["periodo_nombre"]
                        )
                periodo_id = periodo_cache[pi]

                # ── Unidad ────────────────────────────────────────────────
                codigo = rec["unidad_codigo"].upper()
                if codigo not in unidad_cache:
                    if DRY_RUN:
                        unidad_cache[codigo] = -1
                    else:
                        unidad_cache[codigo] = get_or_create_unidad(
                            cur, codigo, rec["unidad_tipo"]
                        )
                unidad_id = unidad_cache[codigo]

                # ── Operador ──────────────────────────────────────────────
                operador_id = None
                if rec.get("operador_nombre"):
                    key = rec["operador_nombre"].lower().strip()
                    if key not in operador_cache:
                        if DRY_RUN:
                            operador_cache[key] = -1
                        else:
                            operador_cache[key] = get_or_create_operador(
                                cur, rec["operador_nombre"]
                            )
                    operador_id = operador_cache[key]

                # ── INSERT carga ──────────────────────────────────────────
                if not DRY_RUN:
                    cur.execute(
                        """
                        INSERT INTO cargas (
                            fecha, folio, periodo_id, unidad_id, operador_id,
                            litros, odometro_hrs,
                            cuenta_lt_inicio, cuenta_lt_fin,
                            origen, tipo_diesel, km_estimado
                        ) VALUES (
                            %s, %s, %s, %s, %s,
                            %s, %s,
                            %s, %s,
                            'patio', 'normal', false
                        )
                        RETURNING id
                        """,
                        (
                            rec["fecha"],
                            rec.get("folio_excel"),
                            periodo_id,
                            unidad_id,
                            operador_id,
                            rec["litros"],
                            rec.get("odometro_hrs"),
                            rec.get("cuenta_lt_inicio"),
                            rec.get("cuenta_lt_fin"),
                        ),
                    )
                    db_id = cur.fetchone()[0]

                    # Actualizar record en memoria
                    rec["status"]       = "importado"
                    rec["importado_at"] = datetime.datetime.now().isoformat()
                    rec["db_id"]        = db_id

                    # Commit cada 500 para no perder todo si falla algo
                    if i % 500 == 0:
                        conn.commit()

                stats["importados"] += 1

            except Exception as e:
                stats["errores"] += 1
                errores_detalle.append(
                    f"  Fila {rec['fila_excel']} "
                    f"({rec.get('unidad_codigo','?')} | {rec.get('fecha','?')}): {e}"
                )
                if not DRY_RUN:
                    conn.rollback()

        # ── Commit final ───────────────────────────────────────────────────
        if not DRY_RUN:
            conn.commit()
            # Guardar JSON actualizado
            with open(PREVIEW, "w", encoding="utf-8") as f:
                json.dump(records, f, ensure_ascii=False, indent=2)
            print(f"\n  ✓ wb_preview.json actualizado con status 'importado'")

        # ── Resumen ────────────────────────────────────────────────────────
        print(f"""
╔═══════════════════════════════════════════════════╗
║           RESULTADO [{modo:^10}]               ║
╠═══════════════════════════════════════════════════╣
║  ✓ Importados   : {stats['importados']:>6}                        ║
║  ✗ Errores      : {stats['errores']:>6}                        ║
║  Períodos únicos: {len(periodo_cache):>6}                        ║
║  Unidades únicas: {len(unidad_cache):>6}                        ║
║  Operadores     : {len(operador_cache):>6}                        ║
╚═══════════════════════════════════════════════════╝""")

        if errores_detalle:
            print(f"\n  Errores ({len(errores_detalle)}):")
            for e in errores_detalle[:30]:
                print(e)
            if len(errores_detalle) > 30:
                print(f"  ... y {len(errores_detalle) - 30} más (ver wb_preview.json status='ok' sin db_id)")

        if DRY_RUN:
            print("""
  Para ejecutar la importación real:
    python3 2_import.py --commit           # sin limpiar
    python3 2_import.py --clean --commit   # limpia DB de prueba primero
""")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR FATAL: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
