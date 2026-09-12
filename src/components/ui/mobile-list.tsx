import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function CatalogPageHeader({
  icon: Icon,
  eyebrow = "Catálogos",
  title,
  meta,
  description,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  meta: string;
  description: string;
}) {
  return (
    <div className="mb-3 md:mb-8">
      <div className="hidden md:flex items-center gap-3 mb-1">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <Icon className="w-4 h-4 text-indigo-500" />
        </div>
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--fg-muted)" }}
        >
          {eyebrow}
        </p>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <h1
          className="font-outfit font-bold text-xl md:text-3xl"
          style={{ color: "var(--fg)" }}
        >
          {title}
        </h1>
        <p className="md:hidden text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>
          {meta}
        </p>
      </div>
      <p className="hidden md:block mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
        {description}
      </p>
    </div>
  );
}

export function CatalogDetalleHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  badges,
}: {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  badges: ReactNode;
}) {
  return (
    <div className="mb-3 md:mb-8">
      <Link
        href={backHref}
        className="flex items-center gap-1.5 text-xs font-semibold mb-2 md:mb-4 hover:text-indigo-500 transition-colors"
        style={{ color: "var(--fg-muted)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
      </Link>
      <p
        className="hidden md:block text-xs font-semibold uppercase tracking-widest mb-1"
        style={{ color: "var(--fg-muted)" }}
      >
        {eyebrow}
      </p>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1
            className="font-outfit font-bold text-xl md:text-3xl truncate"
            style={{ color: "var(--fg)" }}
          >
            {title}
          </h1>
          {subtitle}
        </div>
        <div className="flex gap-1.5 flex-wrap shrink-0 mt-0.5">{badges}</div>
      </div>
    </div>
  );
}

export function MobileStickyToolbar({ children }: { children: ReactNode }) {
  return (
    <div
      className="sticky top-14 z-30 -mx-4 px-4 py-2 border-b md:contents md:border-0"
      style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}
    >
      {children}
    </div>
  );
}

export type MobileStatItem = {
  key: string;
  label: string;
  value: string;
  tone?: "default" | "danger" | "success" | "accent";
  onClick?: () => void;
  active?: boolean;
};

const STAT_TONE: Record<NonNullable<MobileStatItem["tone"]>, string> = {
  default: "",
  danger: "text-red-500",
  success: "text-emerald-500",
  accent: "text-indigo-500",
};

export function MobileStatStrip({
  items,
  className,
}: {
  items: MobileStatItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "md:hidden flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {items.map((item) => {
        const className = cn(
          "shrink-0 rounded-full border px-2.5 py-1 flex items-baseline gap-1.5",
          item.onClick && "active:scale-[0.98] transition-transform",
          item.active && "ring-2 ring-indigo-500/30",
        );
        const style = {
          borderColor: item.active
            ? "rgb(99 102 241 / 0.45)"
            : item.tone === "danger"
              ? "rgb(239 68 68 / 0.35)"
              : "var(--border)",
          backgroundColor: item.tone === "danger"
            ? "rgb(239 68 68 / 0.06)"
            : item.active
              ? "rgb(99 102 241 / 0.06)"
              : "var(--surface)",
        } as const;
        const body = (
          <>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--fg-muted)" }}
            >
              {item.label}
            </span>
            <span
              className={cn(
                "font-outfit font-bold text-sm tabular-nums",
                STAT_TONE[item.tone ?? "default"],
              )}
              style={item.tone == null || item.tone === "default" ? { color: "var(--fg)" } : undefined}
            >
              {item.value}
            </span>
          </>
        );
        if (item.onClick) {
          return (
            <button key={item.key} type="button" onClick={item.onClick} className={className} style={style}>
              {body}
            </button>
          );
        }
        return (
          <div key={item.key} className={className} style={style}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function MobileList({
  children,
  empty,
  className,
}: {
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("md:hidden rounded-2xl border overflow-hidden", className)}
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      {empty ?? children}
    </div>
  );
}

export function MobileRow({
  onClick,
  children,
  className,
}: {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const cls = cn(
    "w-full text-left px-3 py-2.5 border-b last:border-b-0",
    onClick && "transition-colors active:bg-[var(--surface-2)]",
    className,
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} style={{ borderColor: "var(--border)" }}>
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={{ borderColor: "var(--border)" }}>
      {children}
    </div>
  );
}
