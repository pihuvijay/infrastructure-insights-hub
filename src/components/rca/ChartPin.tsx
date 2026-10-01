"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Bot, X } from "lucide-react";
import { openAgent } from "@/lib/agent-store";
import type { Cluster } from "@/lib/types";

interface Pin {
  x: number;
  y: number;
  label: string;
  summary: string;
  cluster: Cluster | null;
}

let pin: Pin | null = null;
let last = { x: 0, y: 0 };
const subs = new Set<() => void>();
const set = (p: Pin | null) => {
  pin = p;
  subs.forEach((f) => f());
};

export const showPin = (info: Omit<Pin, "x" | "y" | "cluster"> & { cluster?: Cluster }) =>
  set({ ...info, cluster: info.cluster ?? null, ...last });

const W = 264;

export function ChartPin() {
  const p = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => pin,
    () => null,
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      last = { x: e.clientX, y: e.clientY };
      if (pin && !ref.current?.contains(e.target as Node)) set(null);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && set(null);
    window.addEventListener("mousedown", down, true);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("mousedown", down, true);
      window.removeEventListener("keydown", key);
    };
  }, []);

  if (!p) return null;
  const left = Math.max(8, Math.min(p.x + 12, window.innerWidth - W - 8));
  const top = Math.max(8, Math.min(p.y + 12, window.innerHeight - 170));
  const ask = () => {
    openAgent(p.cluster, undefined, { label: p.label, summary: p.summary });
    set(null);
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={p.label}
      style={{ left, top, width: W }}
      className="fixed z-50 rounded-xl border bg-popover p-3.5 shadow-2xl animate-in fade-in zoom-in-95"
    >
      <button
        onClick={() => set(null)}
        aria-label="Close"
        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
      <div className="pr-5 text-sm font-medium leading-snug">{p.label}</div>
      <p className="mt-1 text-xs text-muted-foreground">{p.summary}</p>
      <button onClick={ask} className="btn-primary mt-3 h-8 w-full justify-center">
        <Bot className="size-4" />
        Ask agent
      </button>
    </div>
  );
}
