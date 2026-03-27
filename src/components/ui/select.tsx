import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Select nativo estilizado — óptimo para móvil y formularios rápidos
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          style={{
            backgroundColor: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--fg)",
          }}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "var(--fg-muted)" }}
        />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
