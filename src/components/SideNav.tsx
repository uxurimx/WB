"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Fuel, LayoutDashboard, Settings, ChevronRight, ChevronDown,
  PlusCircle, ClipboardList, Truck, Users, HardHat, Menu, X,
  Wrench, Calendar, Shield,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { siteConfig } from "@/config/site";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { ROLE_NAV_PERMISSIONS, type NavPermission } from "@/lib/permissions";

type NavItemDef = { name: string; href: string; icon: React.ComponentType<{ className?: string }> };

function getNavSections(permisos: NavPermission[]) {
  const has = (p: NavPermission) => permisos.includes(p);

  const cargasItems: NavItemDef[] = [
    ...(has("cargas.nueva_patio") ? [{ name: "Nueva Carga Patio", href: "/cargas/nueva", icon: PlusCircle }] : []),
    ...(has("cargas.nueva_campo") ? [{ name: "Nueva Carga Campo", href: "/cargas/campo", icon: Fuel }] : []),
    ...(has("cargas.historial")   ? [{ name: "Historial",         href: "/cargas",       icon: ClipboardList }] : []),
  ];

  const catalogoItems: NavItemDef[] = has("catalogo") ? [
    { name: "Unidades",   href: "/catalogo/unidades",   icon: Truck },
    { name: "Operadores", href: "/catalogo/operadores", icon: Users },
    { name: "Obras",      href: "/catalogo/obras",      icon: HardHat },
  ] : [];

  const sistemaItems: NavItemDef[] = [
    ...(has("admin") ? [
      { name: "Administración", href: "/admin",          icon: Shield },
      { name: "Importar Datos", href: "/admin/importar", icon: Wrench },
    ] : []),
    ...(has("settings") ? [{ name: "Configuración", href: "/settings", icon: Settings }] : []),
  ];

  return [
    ...(has("dashboard") ? [{
      label: null as null,
      collapsible: false,
      items: [{ name: "Dashboard", href: "/overview", icon: LayoutDashboard }],
    }] : []),
    ...(cargasItems.length ? [{
      label: "Cargas",
      collapsible: false,
      items: cargasItems,
    }] : []),
    ...(catalogoItems.length ? [{
      label: "Catálogos",
      collapsible: true,
      items: catalogoItems,
    }] : []),
    ...(has("periodos") ? [{
      label: "Análisis",
      collapsible: false,
      items: [{ name: "Períodos", href: "/periodos", icon: Calendar }],
    }] : []),
    ...(sistemaItems.length ? [{
      label: "Sistema",
      collapsible: false,
      items: sistemaItems,
    }] : []),
  ];
}

function NavItem({
  name,
  href,
  icon: Icon,
  onNavigate,
}: NavItemDef & { onNavigate?: () => void }) {
  const pathname  = usePathname();
  const isActive  = pathname === href || (href !== "/overview" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group",
        isActive
          ? "bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/20"
          : "hover:bg-[var(--surface-2)]"
      )}
      style={!isActive ? { color: "var(--fg-muted)" } : undefined}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            "w-4 h-4",
            isActive ? "text-white" : "group-hover:text-indigo-500 transition-colors"
          )}
        />
        <span className="text-sm">{name}</span>
      </div>
      {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useUser();
  const role     = user?.publicMetadata?.role as string | undefined;
  const pathname = usePathname();

  const [permisos, setPermisos] = useState<NavPermission[]>(
    role ? (ROLE_NAV_PERMISSIONS[role] ?? []) : []
  );

  useEffect(() => {
    fetch("/api/me/perms")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.permisos)) setPermisos(data.permisos); })
      .catch(() => {});
  }, []);

  const navSections = getNavSections(permisos);

  // Catálogos abierto si la ruta actual está dentro
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    const inCatalogos = pathname.startsWith("/catalogo");
    return inCatalogos ? new Set() : new Set(["Catálogos"]);
  });

  function toggleSection(label: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Brand */}
      
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Fuel className="text-indigo-500 w-5 h-5" />
        </div>
        <div className="flex flex-col text-left">
          <Link href="/overview">
            <span className="font-outfit font-bold text-base leading-tight" style={{ color: "var(--fg)" }}>
              {siteConfig.name}
            </span>
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            v{siteConfig.version}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto">
        {navSections.map((section, i) => {
          const isCollapsed = section.label ? collapsedSections.has(section.label) : false;

          return (
            <div key={i}>
              {section.label && (
                section.collapsible ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.label!)}
                    className="w-full flex items-center justify-between px-3 mb-1.5 group"
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {section.label}
                    </span>
                    {isCollapsed
                      ? <ChevronDown className="w-3 h-3" style={{ color: "var(--fg-muted)" }} />
                      : <ChevronDown className="w-3 h-3 rotate-180 transition-transform" style={{ color: "var(--fg-muted)" }} />
                    }
                  </button>
                ) : (
                  <p
                    className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {section.label}
                  </p>
                )
              )}

              {!isCollapsed && (
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavItem key={item.href} {...item} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Tema</span>
          <ThemeToggle />
        </div>
        <div
          className="flex items-center gap-3 px-2 py-2.5 rounded-xl border"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <UserButton afterSignOutUrl="/" />
          <div className="flex flex-col overflow-hidden text-left">
            <span className="text-xs font-semibold truncate" style={{ color: "var(--fg)" }}>
              {user?.firstName ?? "Usuario"} {user?.lastName ?? ""}
            </span>
            <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop sidebar ─────────────────────────────────────────
export default function SideNav() {
  return (
    <aside
      className="hidden lg:flex h-screen w-64 flex-col fixed left-0 top-0 z-50 border-r"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <SidebarContent />
    </aside>
  );
}

// ─── Mobile header ───────────────────────────────────────────
export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Fuel className="text-indigo-500 w-4 h-4" />
          </div>
          <Link href="/overview">
          <span className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>
            {siteConfig.name}
          </span>
          </Link>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" style={{ color: "var(--fg)" }} />
        </button>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            className="relative w-72 h-full border-r shadow-2xl"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
            </button>
            {/* onNavigate cierra el drawer al pulsar cualquier enlace */}
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
