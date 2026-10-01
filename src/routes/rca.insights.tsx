import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/AppSidebar";
import { AGENTS, CLUSTERS, HEATMAP, MONTHLY, ROOT_CAUSES, SUBSYSTEMS, type Cluster } from "@/lib/data";
import { openAgent, useAgent } from "@/lib/agent-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rca/insights")({
  head: () => ({
    meta: [
      { title: "Incident Insights — GEV System Delivery" },
      { name: "description", content: "Multi-agent RCA insights: incident trends, root causes, subsystems and high-priority clusters." },
      { property: "og:title", content: "Incident Insights — GEV System Delivery" },
      { property: "og:description", content: "See recurring root causes and the hours they cost." },
    ],
  }),
  component: Insights,
});

const C = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }, cursor: { fill: "var(--chart-grid)" } };
const sevCls = { critical: "bg-destructive-soft text-destructive", high: "bg-warning-soft text-warning", medium: "bg-muted text-muted-foreground" };
const sevRank = { critical: 3, high: 2, medium: 1 };

const SORTS = {
  savable: { label: "Most savable", fn: (a: Cluster, b: Cluster) => b.hoursSavable - a.hoursSavable },
  spent: { label: "Most time spent", fn: (a: Cluster, b: Cluster) => b.hoursSpent - a.hoursSpent },
  incidents: { label: "Most frequent", fn: (a: Cluster, b: Cluster) => b.incidents - a.incidents },
  severity: { label: "Severity", fn: (a: Cluster, b: Cluster) => sevRank[b.severity] - sevRank[a.severity] },
} as const;

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-5", className)}>
      <h3 className="eyebrow mb-4">{title}</h3>
      {children}
    </section>
  );
}

function Insights() {
  const [sort, setSort] = useState<keyof typeof SORTS>("savable");
  const [sev, setSev] = useState<"all" | Cluster["severity"]>("all");
  const { cluster: tagged } = useAgent();
  const clusters = useMemo(() => CLUSTERS.filter((c) => sev === "all" || c.severity === sev).sort(SORTS[sort].fn), [sort, sev]);
  const savable = CLUSTERS.reduce((a, c) => a + c.hoursSavable, 0);
  const maxH = Math.max(...HEATMAP.flatMap((r) => r.hours));

  return (
    <>
      <PageHeader
        title="Insights"
        sub={`${savable}h could be saved by fixing ${CLUSTERS.length} recurring root causes.`}
        action={<button onClick={() => openAgent(null)} className="btn-primary"><Bot className="size-4" />Ask the agent</button>}
      />

      {/* Pipeline */}
      <div className="panel mb-5 flex items-center gap-1 overflow-x-auto p-3">
        {AGENTS.map((a, i) => (
          <div key={a.id} className="flex items-center gap-1">
            <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
              <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40" /><span className="relative size-2 rounded-full bg-primary" /></span>
              <div className="leading-tight"><div className="text-[13px] font-medium">{a.name}</div><div className="text-[11px] text-muted-foreground">{a.desc}</div></div>
            </div>
            {i < AGENTS.length - 1 && <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />}
          </div>
        ))}
      </div>

      {/* Clusters */}
      <section className="mb-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-[15px] font-semibold">High-priority clusters</h2>
          {(["all", "critical", "high", "medium"] as const).map((s) => (
            <button key={s} onClick={() => setSev(s)} className={cn("h-7 rounded-full border px-3 text-xs capitalize", sev === s ? "border-primary/40 bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground")}>{s}</button>
          ))}
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className="h-7 rounded-full border bg-card px-3 text-xs">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {clusters.map((c) => {
            const pct = Math.round((c.hoursSavable / c.hoursSpent) * 100);
            return (
              <button key={c.id} onClick={() => openAgent(c)} className={cn("panel group p-4 text-left transition hover:border-primary/40", tagged?.id === c.id && "border-primary ring-1 ring-primary/40")}>
                <div className="flex items-center justify-between">
                  <span className={cn("rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", sevCls[c.severity])}>{c.severity}</span>
                  <Bot className="size-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="mt-3 font-medium leading-snug">{c.name}</div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div><div className="text-xl font-semibold tabular-nums">{c.incidents}</div><div className="text-[11px] text-muted-foreground">incidents</div></div>
                  <div><div className="text-xl font-semibold tabular-nums">{c.hoursSpent}h</div><div className="text-[11px] text-muted-foreground">spent</div></div>
                  <div><div className="text-xl font-semibold tabular-nums text-primary">{c.hoursSavable}h</div><div className="text-[11px] text-muted-foreground">savable</div></div>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card title="Incidents per month · avg resolution (h)" className="lg:col-span-3">
          <div className="h-60">
            <ResponsiveContainer>
              <ComposedChart data={MONTHLY}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis yAxisId="l" {...axis} width={28} />
                <YAxis yAxisId="r" orientation="right" {...axis} width={28} />
                <Tooltip {...tip} />
                <Bar yAxisId="l" dataKey="incidents" name="Incidents" fill={C[0]} radius={[4, 4, 0, 0]} barSize={22} />
                <Line yAxisId="r" dataKey="avgHours" name="Avg hours" stroke={C[2]} strokeWidth={2} dot={{ r: 3, fill: C[2] }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Root cause distribution" className="lg:col-span-2">
          <div className="flex h-60 items-center">
            <ResponsiveContainer width="55%">
              <PieChart>
                <Pie data={ROOT_CAUSES} dataKey="value" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none">
                  {ROOT_CAUSES.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex-1 space-y-2">
              {ROOT_CAUSES.map((r, i) => (
                <li key={r.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2 rounded-sm" style={{ background: C[i % C.length] }} />
                  <span className="flex-1 text-muted-foreground">{r.name}</span>
                  <span className="tabular-nums">{r.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Incidents by subsystem" className="lg:col-span-2">
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={SUBSYSTEMS} layout="vertical" barSize={14}>
                <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" {...axis} />
                <YAxis type="category" dataKey="name" {...axis} width={78} />
                <Tooltip {...tip} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="critical" stackId="s" fill={C[3]} name="Critical" />
                <Bar dataKey="high" stackId="s" fill={C[2]} name="High" />
                <Bar dataKey="medium" stackId="s" fill={C[1]} name="Medium" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Resolution heatmap · hours to resolve" className="lg:col-span-3">
          <div className="grid grid-cols-[88px_repeat(6,1fr)] gap-1.5 text-xs">
            <div />
            {MONTHLY.map((m) => <div key={m.month} className="text-center text-muted-foreground">{m.month}</div>)}
            {HEATMAP.map((r) => (
              <div key={r.name} className="contents">
                <div className="flex items-center text-muted-foreground">{r.name}</div>
                {r.hours.map((h, i) => (
                  <div key={i} title={`${r.name} · ${MONTHLY[i]?.month}: ${h}h`} className="grid h-9 place-items-center rounded-md font-mono text-[11px] tabular-nums" style={{ background: `color-mix(in oklab, var(--chart-4) ${Math.round((h / maxH) * 85) + 6}%, var(--surface))` }}>
                    {h}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
