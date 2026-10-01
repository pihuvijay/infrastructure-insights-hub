"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

const MANAGERS = ["J. Whitfield", "S. Patel", "D. Moreau"];

function Toggle({ label, desc, def }: { label: string; desc: string; def?: boolean }) {
  const [on, setOn] = useState(!!def);
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn(!on)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition",
          on ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-foreground transition",
            on ? "left-4.5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function AdminView() {
  return (
    <>
      <PageHeader title="Admin Settings" />
      <div className="max-w-2xl space-y-5">
        <section className="panel p-5">
          <div className="eyebrow mb-2">Line manager</div>
          <select className="input" defaultValue={MANAGERS[0]} aria-label="Line manager">
            {MANAGERS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </section>
        <section className="panel divide-y">
          <Toggle
            label="Auto-notify on snapshot"
            desc="Send your manager a message when you log a snapshot"
            def
          />
          <Toggle
            label="Weekly insights digest"
            desc="Email the top recurring clusters every Monday"
            def
          />
        </section>
        <p className="text-xs text-muted-foreground">
          ServiceNow and Box syncing is managed under RCA → Upload.
        </p>
      </div>
    </>
  );
}
