import { currentUser } from "@clerk/nextjs/server";
import { requirePermission } from "@/lib/server-guard";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/ThemeToggle";
import SeedButton from "@/components/SeedButton";
import TestingPanel from "@/components/settings/TestingPanel";
import AlertasConfig from "@/components/settings/AlertasConfig";
import { getAlertaDias, getTolerancia } from "@/app/actions/setup";
import { TOLERANCIA_DEFAULT } from "@/lib/alertas-config";
import ToleranciaConfig from "@/components/settings/ToleranciaConfig";

export default async function SettingsPage() {
  await requirePermission("settings");

  const [user, alertaDias, tolerancia] = await Promise.all([
    currentUser(),
    getAlertaDias(),
    getTolerancia(),
  ]);
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>
          Sistema
        </p>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Configuración
        </h1>
      </div>

      {/* Cuenta */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>
          Cuenta
        </h2>
        <div className="p-5 rounded-2xl border flex items-center gap-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-12 h-12 rounded-xl" } }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </section>

      {/* Apariencia */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>
          Apariencia
        </h2>
        <div className="p-5 rounded-2xl border flex items-center justify-between"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>Tema</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Claro u oscuro.</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {/* Alertas */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>
          Alertas
        </h2>
        <div className="p-5 rounded-2xl border space-y-3"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--fg)" }}>
              Ventana de alertas de rendimiento
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--fg-muted)" }}>
              Días que se muestran las alertas de rendimiento después de cerrar un período.
            </p>
            <AlertasConfig initialDias={alertaDias} />
          </div>
        </div>
      </section>

      {/* Rendimiento */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>
          Rendimiento
        </h2>
        <div className="p-5 rounded-2xl border space-y-3"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--fg)" }}>
              Tolerancia de rendimiento
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--fg-muted)" }}>
              Margen máximo de desviación permitido sobre el rendimiento de referencia. Por defecto {Math.round(TOLERANCIA_DEFAULT * 100)}%.
            </p>
            <ToleranciaConfig initialPct={Math.round(tolerancia * 100)} />
          </div>
        </div>
      </section>

      {/* Setup inicial */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>
          Datos Iniciales
        </h2>
        <div className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div>
            <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--fg)" }}>
              Seed Inicial
            </p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Crea tanques (Taller + NISSAN) y fuentes de diesel base. Solo si están vacíos.
            </p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--fg)" }}>
              Seed Unidades WB
            </p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Importa el catálogo de camiones (CA06–CA34) y maquinaria del sistema WB. Solo si no hay unidades.
            </p>
          </div>
          <SeedButton />
        </div>
      </section>

      {/* Zona de testing — solo admins */}
      {isAdmin && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-muted)" }}>
            Testing
          </h2>
          <TestingPanel />
        </section>
      )}
    </div>
  );
}
