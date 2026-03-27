import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border px-3 py-2 text-sm transition-colors resize-y",
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
Textarea.displayName = "Textarea";

export { Textarea };
