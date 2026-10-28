"use client";

import { useEffect, useState } from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { formatFechaDmy, normalizarBorradorFechaDmy, parseFechaDmy } from "@/lib/date-utils";

type DateDmyInputProps = Omit<InputProps, "type" | "value" | "onChange" | "inputMode"> & {
  value: string;
  onChange: (value: string) => void;
};

export default function DateDmyInput({ value, onChange, ...props }: DateDmyInputProps) {
  const [draft, setDraft] = useState(() => formatFechaDmy(value));

  useEffect(() => {
    setDraft(formatFechaDmy(value));
  }, [value]);

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      maxLength={10}
      placeholder="DD/MM/AAAA"
      value={draft}
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
  );
}
