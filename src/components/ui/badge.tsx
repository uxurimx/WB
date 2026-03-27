import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:   "bg-indigo-500/15 text-indigo-500 border border-indigo-500/20",
        success:   "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20",
        warning:   "bg-amber-500/15 text-amber-600 border border-amber-500/20",
        danger:    "bg-red-500/15 text-red-500 border border-red-500/20",
        secondary: "bg-[var(--surface-2)] text-[var(--fg-muted)] border border-[var(--border)]",
        outline:   "border border-[var(--border)] text-[var(--fg-muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
