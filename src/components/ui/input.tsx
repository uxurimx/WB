import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border px-3 py-2 text-sm transition-colors",
          "placeholder:text-[var(--fg-muted)]",
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
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
