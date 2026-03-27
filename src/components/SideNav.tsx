"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Fuel,
  LayoutDashboard,
  Settings,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  ClipboardList,
  Truck,
  Users,
  HardHat,
  Menu,
  X,
  Wrench,
  Calendar,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { siteConfig } from "@/config/site";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

// ─── Estructura de navegación ────────────────────────────────
const navSections = [
  {
    label: null,
    items: [
      { name: "Dashboard", href: "/overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "Cargas",
    items: [
      { name: "Nueva Carga Patio", href: "/cargas/nueva", icon: PlusCircle },
      { name: "Nueva Carga Campo", href: "/cargas/campo", icon: Fuel },
      { name: "Historial", href: "/cargas", icon: ClipboardList },
    ],
  },
  {
    label: "Catálogos",
    items: [
      { name: "Unidades", href: "/catalogo/unidades", icon: Truck },
      { name: "Operadores", href: "/catalogo/operadores", icon: Users },
      { name: "Obras", href: "/catalogo/obras", icon: HardHat },
    ],
  },
  {
    label: "Análisis",
    items: [
      { name: "Períodos", href: "/periodos", icon: Calendar },
    ],
  },
  {
    label: "Sistema",
    items: [
      { name: "Configuración", href: "/settings", icon: Settings },
    ],
  },
];

function NavItem({ name, href, icon: Icon }: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/overview" && pathname.startsWith(href));

  return (
    <Link
      href={href}
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

function SidebarContent() {
  const { user } = useUser();

  return (
    <div className="h-full flex flex-col p-4">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-8 mt-2">
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Fuel className="text-indigo-500 w-5 h-5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-outfit font-bold text-base leading-tight" style={{ color: "var(--fg)" }}>
            {siteConfig.name}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            v{siteConfig.version}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto">
        {navSections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p
                className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--fg-muted)" }}
              >
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: theme + user */}
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
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:flex h-screen w-64 flex-col fixed left-0 top-0 z-50 border-r"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile — se controla desde MobileHeader */}
    </>
  );
}

// ─── Mobile header con menú ──────────────────────────────────
export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top bar */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Fuel className="text-indigo-500 w-4 h-4" />
          </div>
          <span className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>
            {siteConfig.name}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" style={{ color: "var(--fg)" }} />
        </button>
      </header>

      {/* Drawer overlay */}
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
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
