"use client";

import { useMemo, useState } from "react";
import { Bot, ChevronRight, Clock, Flame, Layers, PiggyBank } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { ChartPin, showPin } from "@/components/rca/ChartPin";
import { openAgent, useAgent } from "@/lib/agent-store";
import { useInsights } from "@/lib/queries";
import type { Cluster, MonthlyPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

const C = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;
const tip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  },
  cursor: { fill: "var(--chart-grid)" },
  labelStyle: { color: "var(--foreground)" },
};
const legend = {
  iconType: "circle",
  iconSize: 7,
  wrapperStyle: { fontSize: 11, paddingTop: 8 },
} as const;
const sevCls = {
  critical: "bg-destructive-soft text-destructive",
  high: "bg-warning-soft text-warning",
  medium: "bg-muted text-muted-foreground",
};
const sevRank = { critical: 3, high: 2, medium: 1 };

const SORTS = {
  savable: {
    label: "Most savable",
    fn: (a: Cluster, b: Cluster) => b.hoursSavable - a.hoursSavable,
  },
  spent: { label: "Most time spent", fn: (a: Cluster, b: Cluster) => b.hoursSpent - a.hoursSpent },
  incidents: { label: "Most frequent", fn: (a: Cluster, b: Cluster) => b.incidents - a.incidents },
  severity: {
    label: "Severity",
    fn: (a: Cluster, b: Cluster) => sevRank[b.severity] - sevRank[a.severity],
  },
} as const;

function Card({
  title,
  sub,
  children,
  className,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel p-5", className)}>
      <h3 className="text-sm font-medium">{title}</h3>
      {sub && <p className="mb-4 mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {!sub && <div className="mb-4" />}
      {children}
    </section>
  );
}

const yLabel = (
  value: string,
  angle = -90,
  position: "insideLeft" | "insideRight" = "insideLeft",
) => ({ value, angle, position, fill: "var(--muted-foreground)", fontSize: 11, offset: 8 });

export function InsightsView() {
  const { data, isLoading, error } = useInsights();
  const [sort, setSort] = useState<keyof typeof SORTS>("savable");
  const [sev, setSev] = useState<"all" | Cluster["severity"]>("all");
  const { cluster: tagged } = useAgent();

  const clusters = useMemo(
    () =>
      (data?.clusters ?? [])
        .filter((c) => sev === "all" || c.severity === sev)
        .sort(SORTS[sort].fn),
    [data, sort, sev],
  );

  if (isLoading)
    return (
      <p className="panel px-5 py-16 text-center text-sm text-muted-foreground">
        Loading insights…
      </p>
    );
  if (error || !data)
    return (
      <p className="rounded-lg bg-destructive-soft px-4 py-3 text-sm text-destructive">
        {(error as Error)?.message ?? "Could not load insights."}
      </p>
    );

  const { monthly, rootCauses, subsystems, heatmap, agents } = data;
  const savable = data.clusters.reduce((a, c) => a + c.hoursSavable, 0);
  const totalIncidents = monthly.reduce((a, m) => a + m.incidents, 0);
  const totalHours = Math.round(monthly.reduce((a, m) => a + m.incidents * m.avgHours, 0));
  const avgHours = (totalHours / totalIncidents).toFixed(1);
  const maxH = Math.max(...heatmap.flatMap((r) => r.hours));
  const clusterBars = data.clusters.map((c) => ({
    name: c.name,
    spent: c.hoursSpent,
    savable: c.hoursSavable,
  }));
  const trend = monthly.map((m, i) => ({
    month: m.month,
    ...Object.fromEntries(data.clusters.map((c) => [c.name, c.trend[i] ?? 0])),
  }));
  const subTotals = subsystems.map((s) => ({ ...s, total: s.critical + s.high + s.medium }));

  const clusterPin = (d: { name: string }) => {
    const c = data.clusters.find((x) => x.name === d.name);
    if (c)
      showPin({
        label: c.name,
        summary: `${c.incidents} incidents, ${c.hoursSpent}h spent, ${c.hoursSavable}h savable.`,
        cluster: c,
      });
  };
  const subPin = (sev: "critical" | "high" | "medium") => (d: (typeof subTotals)[number]) =>
    showPin({
      label: `${d.name} · ${sev}`,
      summary: `${d[sev]} ${sev} incidents out of ${d.total} in this subsystem.`,
    });
  const trendPin = (st: {
    activeLabel?: string | number;
    activePayload?: { name?: string; value?: number }[];
  }) => {
    if (!st?.activePayload?.length) return;
    showPin({
      label: `Cluster trend · ${st.activeLabel}`,
      summary: st.activePayload.map((p) => `${p.name}: ${p.value}`).join("; ") + ".",
    });
  };

  const kpis = [
    { label: "Incidents · 6 months", value: totalIncidents, icon: Layers },
    { label: "Hours spent resolving", value: `${totalHours}h`, icon: Clock },
    { label: "Avg resolution", value: `${avgHours}h`, icon: Flame },
    { label: "Hours savable", value: `${savable}h`, icon: PiggyBank, accent: true },
  ];

  return (
    <>
      <PageHeader
        title="Insights"
        sub={`${savable}h savable`}
        action={
          <button onClick={() => openAgent(null)} className="btn-primary">
            <Bot className="size-4" />
            Ask the agent
          </button>
        }
      />

      <div className="panel mb-5 flex items-center gap-1 overflow-x-auto p-3">
        {agents.map((a, i) => (
          <div key={a.id} className="flex items-center gap-1">
            <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40" />
                <span className="relative size-2 rounded-full bg-primary" />
              </span>
              <div className="leading-tight">
                <div className="text-[13px] font-medium">{a.name}</div>
                <div className="text-[11px] text-muted-foreground">{a.desc}</div>
              </div>
            </div>
            {i < agents.length - 1 && (
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
            )}
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="panel flex items-center gap-4 p-5">
            <div
              className={cn(
                "grid size-10 place-items-center rounded-lg",
                k.accent ? "bg-primary-soft text-primary" : "bg-surface text-muted-foreground",
              )}
            >
              <k.icon className="size-4.5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div
                className={cn("text-2xl font-semibold tabular-nums", k.accent && "text-primary")}
              >
                {k.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="mb-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-[15px] font-semibold">High-priority clusters</h2>
          {(["all", "critical", "high", "medium"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSev(s)}
              aria-pressed={sev === s}
              className={cn(
                "h-7 rounded-full border px-3 text-xs capitalize",
                sev === s
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
            aria-label="Sort clusters"
            className="h-7 rounded-full border bg-card px-3 text-xs"
          >
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {clusters.map((c) => (
            <button
              key={c.id}
              onClick={() => openAgent(c)}
              className={cn(
                "panel group p-4 text-left transition hover:border-primary/40",
                tagged?.id === c.id && "border-primary ring-1 ring-primary/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                    sevCls[c.severity],
                  )}
                >
                  {c.severity}
                </span>
                <Bot className="size-4 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="mt-3 font-medium leading-snug">{c.name}</div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div>
                  <div className="text-xl font-semibold tabular-nums">{c.incidents}</div>
                  <div className="text-[11px] text-muted-foreground">incidents</div>
                </div>
                <div>
                  <div className="text-xl font-semibold tabular-nums">{c.hoursSpent}h</div>
                  <div className="text-[11px] text-muted-foreground">spent</div>
                </div>
                <div>
                  <div className="text-xl font-semibold tabular-nums text-primary">
                    {c.hoursSavable}h
                  </div>
                  <div className="text-[11px] text-muted-foreground">savable</div>
                </div>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round((c.hoursSavable / c.hoursSpent) * 100)}%` }}
                />
              </div>
            </button>
          ))}
          {clusters.length === 0 && (
            <p className="panel col-span-full px-5 py-10 text-center text-sm text-muted-foreground">
              No clusters at this severity.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-6">
        <Card title="Incidents per month" sub="Count and average hours" className="lg:col-span-4">
          <div className="h-72">
            <ResponsiveContainer minWidth={0}>
              <ComposedChart data={monthly} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis
                  yAxisId="l"
                  {...axis}
                  width={44}
                  allowDecimals={false}
                  label={yLabel("Incidents")}
                />
                <YAxis
                  yAxisId="r"
                  orientation="right"
                  {...axis}
                  width={44}
                  domain={[0, 10]}
                  label={yLabel("Avg hours", 90, "insideRight")}
                />
                <Tooltip {...tip} />
                <Legend {...legend} />
                <Bar
                  isAnimationActive={false}
                  yAxisId="l"
                  dataKey="incidents"
                  name="Incidents"
                  fill={C[0]}
                  radius={[4, 4, 0, 0]}
                  barSize={34}
                  onClick={(d: MonthlyPoint) =>
                    showPin({
                      label: `${d.month} incidents`,
                      summary: `${d.incidents} incidents, average ${d.avgHours}h to resolve.`,
                    })
                  }
                >
                  <LabelList
                    dataKey="incidents"
                    position="top"
                    fill="var(--foreground)"
                    fontSize={11}
                  />
                </Bar>
                <Line
                  yAxisId="r"
                  dataKey="avgHours"
                  name="Avg hours to resolve"
                  stroke={C[2]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: C[2] }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Root cause distribution" className="lg:col-span-2">
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer minWidth={0}>
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={rootCauses}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                  onClick={(d: { name: string; value: number }) =>
                    showPin({
                      label: `Root cause: ${d.name}`,
                      summary: `${d.value}% of classified incidents.`,
                    })
                  }
                >
                  {rootCauses.map((_, i) => (
                    <Cell key={i} fill={C[i % C.length]} />
                  ))}
                </Pie>
                <Tooltip {...tip} formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="text-xl font-semibold tabular-nums">{rootCauses[0]?.value}%</div>
                <div className="text-[10px] text-muted-foreground">{rootCauses[0]?.name}</div>
              </div>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {rootCauses.map((r, i) => (
              <li key={r.name} className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-sm" style={{ background: C[i % C.length] }} />
                  <span className="flex-1 text-muted-foreground">{r.name}</span>
                  <span className="tabular-nums">{r.value}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full"
                    style={{ width: `${r.value}%`, background: C[i % C.length] }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Spent vs savable" sub="Hours" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer minWidth={0}>
              <BarChart
                data={clusterBars}
                layout="vertical"
                margin={{ left: 8, right: 36 }}
                barGap={4}
              >
                <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" {...axis} unit="h" />
                <YAxis type="category" dataKey="name" {...axis} width={150} />
                <Tooltip {...tip} formatter={(v: number) => `${v}h`} />
                <Legend {...legend} />
                <Bar
                  isAnimationActive={false}
                  dataKey="spent"
                  name="Hours spent"
                  fill={C[1]}
                  radius={[0, 4, 4, 0]}
                  barSize={14}
                  onClick={clusterPin}
                >
                  <LabelList
                    dataKey="spent"
                    position="right"
                    fill="var(--foreground)"
                    fontSize={11}
                    formatter={(v: number) => `${v}h`}
                  />
                </Bar>
                <Bar
                  isAnimationActive={false}
                  dataKey="savable"
                  name="Hours savable"
                  fill={C[0]}
                  radius={[0, 4, 4, 0]}
                  barSize={14}
                  onClick={clusterPin}
                >
                  <LabelList
                    dataKey="savable"
                    position="right"
                    fill="var(--foreground)"
                    fontSize={11}
                    formatter={(v: number) => `${v}h`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Subsystems" sub="By severity" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer minWidth={0}>
              <BarChart
                data={subTotals}
                layout="vertical"
                margin={{ left: 8, right: 28 }}
                barSize={16}
              >
                <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="name" {...axis} width={78} />
                <Tooltip {...tip} />
                <Legend {...legend} />
                <Bar
                  isAnimationActive={false}
                  dataKey="critical"
                  stackId="s"
                  fill={C[3]}
                  name="Critical"
                  onClick={subPin("critical")}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="high"
                  stackId="s"
                  fill={C[2]}
                  name="High"
                  onClick={subPin("high")}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="medium"
                  stackId="s"
                  fill={C[1]}
                  name="Medium"
                  radius={[0, 4, 4, 0]}
                  onClick={subPin("medium")}
                >
                  <LabelList
                    dataKey="total"
                    position="right"
                    fill="var(--foreground)"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Cluster trend" sub="Per month" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer minWidth={0}>
              <LineChart
                data={trend}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                onClick={trendPin}
              >
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis {...axis} width={44} allowDecimals={false} label={yLabel("Incidents")} />
                <Tooltip {...tip} />
                <Legend {...legend} />
                {data.clusters.map((c, i) => (
                  <Line
                    key={c.id}
                    dataKey={c.name}
                    stroke={C[i % C.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Resolution time" sub="Hours to resolve" className="lg:col-span-3">
          <div className="grid grid-cols-[88px_repeat(6,1fr)] gap-1.5 text-xs">
            <div />
            {monthly.map((m) => (
              <div key={m.month} className="text-center text-muted-foreground">
                {m.month}
              </div>
            ))}
            {heatmap.map((r) => (
              <div key={r.name} className="contents">
                <div className="flex items-center text-muted-foreground">{r.name}</div>
                {r.hours.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    title={`${r.name} · ${monthly[i]?.month}: ${h}h`}
                    onClick={() =>
                      showPin({
                        label: `${r.name} · ${monthly[i]?.month}`,
                        summary: `${h}h to resolve (peak across subsystems: ${maxH}h).`,
                      })
                    }
                    className="grid h-9 cursor-pointer place-items-center rounded-md font-mono text-[11px] tabular-nums transition hover:ring-1 hover:ring-primary"
                    style={{
                      background: `color-mix(in oklab, var(--chart-4) ${Math.round((h / maxH) * 85) + 6}%, var(--surface))`,
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
            0h
            <span
              className="h-2 w-24 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, color-mix(in oklab, var(--chart-4) 6%, var(--surface)), color-mix(in oklab, var(--chart-4) 91%, var(--surface)))",
              }}
            />
            {maxH}h
          </div>
        </Card>
      </div>
      <ChartPin />
    </>
  );
}
