"use client";

import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

export function FilterMenu({
  label,
  options,
  value,
  onChange,
  single,
  children,
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  single?: boolean;
  children?: React.ReactNode;
}) {
  const toggle = (v: string) =>
    onChange(
      single
        ? value.includes(v)
          ? []
          : [v]
        : value.includes(v)
          ? value.filter((x) => x !== v)
          : [...value, v],
    );
  const shown = value.length === 1 ? options.find((o) => o.value === value[0])?.label : null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-[13px] transition hover:border-primary/40",
            value.length > 0 && "border-primary/40 text-primary",
          )}
        >
          {label}
          {value.length > 0 && (
            <span className="rounded bg-primary-soft px-1.5 font-mono text-[11px]">
              {shown ?? value.length}
            </span>
          )}
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => toggle(o.value)}
            role="menuitemcheckbox"
            aria-checked={value.includes(o.value)}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] hover:bg-surface"
          >
            <span
              className={cn(
                "grid size-4 place-items-center rounded border",
                value.includes(o.value) && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {value.includes(o.value) && <Check className="size-3" />}
            </span>
            {o.label}
          </button>
        ))}
        {children}
        {value.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="mt-1 w-full rounded-md px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
