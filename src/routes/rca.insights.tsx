import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, TrendingDown, Layers, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/AppSidebar";
import { CLUSTERS, INCIDENTS } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rca/insights")({
  head: () => ({
    meta: [
      { title: "Incident Insights — InfraCore" },
      { name: "description", content: "Clustered recurring incidents with hours spent and estimated time savings." },
      { property: "og:title", content: "Incident Insights — InfraCore" },
      { property: "og:description", content: "See recurring root causes and the hours they cost." },
    ],
  }),
  component: Insights,
});

const sev = {
  critical: "bg-destructive-soft text-destructive",
  high: "bg-warning-soft text-warning",
  medium: "bg-muted text-muted-foreground",
};

function Insights() {
  const spent = CLUSTERS.reduce((a, c) => a + c.hoursSpent, 0);
  const savable = CLUSTERS.reduce((a, c) => a + c.hoursSavable, 0);
  const total = CLUSTERS.reduce((a, c) => a + c.incidents, 0);
  const kpis = [
    { label: "Hours spent on repeats", v: `${spent}h`, icon: Clock },
    { label: "Estimated hours savable", v: `${savable}h`, icon: TrendingDown, accent: true },
    { label: "Incidents in clusters", v: `${total}`, icon: Layers },
  ];

  return (
    <>
      <PageHeader title="Insights" sub="Recurring root causes, grouped automatically — with what they're costing the team." />

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className={cn("panel p-5", k.accent && "border-primary/30")}>
            <k.icon className={cn("size-4", k.accent ? "text-primary" : "text-muted-foreground")} />
            <div className={cn("mt-4 text-3xl font-semibold tracking-tight tabular-nums", k.accent && "text-primary")}>{k.v}</div>
            <div className="mt-1 text-sm text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {CLUSTERS.map((c) => {
          const max = Math.max(...c.trend, 1);
          const related = INCIDENTS.filter((i) => i.cluster === c.id);
          const pct = Math.round((c.hoursSavable / c.hoursSpent) * 100);
          return (
            <article key={c.id} className="panel p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("rounded-md px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider", sev[c.severity])}>{c.severity}</span>
                    <span className="font-mono text-xs text-muted-foreground">{c.incidents} incidents · {new Set(related.map((r) => r.owner)).size} different engineers</span>
                  </div>
                  <h2 className="mt-2.5 text-lg font-semibold tracking-tight">{c.name}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{c.summary}</p>
                </div>
                <div className="flex items-end gap-1" aria-label="6-month trend">
                  {c.trend.map((t, i) => <div key={i} className="w-2.5 rounded-sm bg-primary/60" style={{ height: `${6 + (t / max) * 34}px` }} />)}
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-t pt-5 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="eyebrow">Recommended permanent fix</div>
                  <p className="mt-1 text-sm">{c.fix}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {related.map((r) => <span key={r.id} className="rounded-md border bg-surface px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{r.id}</span>)}
                  </div>
                </div>
                <div className="min-w-56">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Spent</span><span className="tabular-nums">{c.hoursSpent}h</span></div>
                  <div className="mt-1 flex justify-between text-sm"><span className="text-muted-foreground">Savable</span><span className="font-medium text-primary tabular-nums">{c.hoursSavable}h</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  <Link to="/rca" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">View similar incidents <ArrowRight className="size-3" /></Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
