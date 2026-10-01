"use client";

import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useReleaseEnvs } from "@/lib/queries";

export function BuildReleaseView() {
  const { data: envs, isLoading, error } = useReleaseEnvs();

  return (
    <>
      <PageHeader title="Build Release Progress" />
      {isLoading && <p className="py-12 text-center text-muted-foreground">Loading releases…</p>}
      {error && <p className="py-12 text-center text-destructive">{(error as Error).message}</p>}
      {envs?.length === 0 && (
        <div className="panel grid place-items-center gap-3 py-20 text-muted-foreground">
          <Rocket className="size-6" />
          <span className="text-sm">No release data yet</span>
        </div>
      )}
      <div className="grid gap-4">
        {envs?.map((e) => {
          const done = e.tickets.filter((t) => t.state === "done").length;
          const active = e.tickets.filter((t) => t.state === "in_progress").length;
          const total = e.tickets.length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <Link
              key={e.id}
              href={`/build-release/${e.id}`}
              aria-label={`${e.id}: ${done} of ${total} tickets done`}
              className="panel group block p-5 transition hover:bg-surface/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-lg font-medium">{e.id}</span>
                <span className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
                  {done}/{total} done · {active} in progress · {pct}%
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="flex h-3 overflow-hidden rounded-full bg-surface"
              >
                <div className="bg-primary" style={{ width: `${pct}%` }} />
                <div
                  className="bg-chart-3"
                  style={{ width: `${total ? (active / total) * 100 : 0}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-4 flex gap-5 font-mono text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          Done
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-chart-3" />
          In progress
        </span>
      </div>
    </>
  );
}
