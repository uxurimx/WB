"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { formatFechaDmy, normalizarBorradorFechaDmy, parseFechaDmy } from "@/lib/date-utils";

type DateDmyInputProps = Omit<InputProps, "type" | "value" | "onChange" | "inputMode"> & {
  value: string;
  onChange: (value: string) => void;
};

export default function DateDmyInput({ value, onChange, ...props }: DateDmyInputProps) {
  const [draft, setDraft] = useState(() => formatFechaDmy(value));
  const calendarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(formatFechaDmy(value));
  }, [value]);

  return (
    <span className="relative block">
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder="DD/MM/AAAA"
        value={draft}
        className={`${props.className ?? ""} pr-11`}
        onFocus={(event) => {
          props.onFocus?.(event);
          event.currentTarget.select();
        }}
        onChange={(event) => {
          const nextDraft = normalizarBorradorFechaDmy(event.target.value);
          setDraft(nextDraft);
          const parsed = parseFechaDmy(nextDraft);
          if (parsed) onChange(parsed);
          else if (!nextDraft) onChange("");
        }}
        onBlur={() => {
          const parsed = parseFechaDmy(draft);
          if (parsed) {
            onChange(parsed);
            setDraft(formatFechaDmy(parsed));
          } else if (!draft) {
            onChange("");
          } else {
            setDraft(formatFechaDmy(value));
          }
        }}
      />
      <button
        type="button"
        aria-label="Abrir calendario"
        onClick={() => {
          const input = calendarInput.current;
          if (!input) return;
          if (typeof input.showPicker === "function") input.showPicker();
          else input.click();
        }}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-xl hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <CalendarDays className="h-4 w-4" style={{ color: "var(--fg-muted)" }} />
      </button>
      <input
        ref={calendarInput}
        type="date"
        tabIndex={-1}
        aria-label="Seleccionar fecha del calendario"
        value={parseFechaDmy(draft) ?? ""}
        onChange={(event) => {
          onChange(event.currentTarget.value);
          setDraft(formatFechaDmy(event.currentTarget.value));
        }}
        className="sr-only"
      />
    </span>
  );
}
