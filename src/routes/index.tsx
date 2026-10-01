import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Server, FolderTree, Lightbulb, Send, CheckCircle2, ArrowUpRight, Search, ArrowRight, Plus, X, Bot, BarChart3 } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";
import { PageHeader, StatusDot } from "@/components/AppSidebar";
import { useEnvs, notifyManager } from "@/lib/env-store";
import { CLUSTERS, FOLDERS, MONTHLY, timeAgo } from "@/lib/data";
import { openAgent } from "@/lib/agent-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Homepage — GEV System Delivery" },
      { name: "description", content: "Your personalised GEV System Delivery dashboard: environments, shortcuts and incident insights." },
      { property: "og:title", content: "Homepage — GEV System Delivery" },
      { property: "og:description", content: "Your personalised operations dashboard." },
    ],
  }),
  component: Home,
});

type WidgetId = "envs" | "patterns" | "tools" | "trend" | "agent";
const CATALOG: { id: WidgetId; title: string; sub: string; icon: typeof Server }[] = [
  { id: "envs", title: "Environment snapshots", sub: "Notify your line manager in one click", icon: Server },
  { id: "patterns", title: "Incident patterns", sub: "Top recurring clusters", icon: Lightbulb },
  { id: "tools", title: "Tool shortcuts", sub: "Your most-used links", icon: FolderTree },
  { id: "trend", title: "Incident trend", sub: "Incidents per month", icon: BarChart3 },
  { id: "agent", title: "Ask the agent", sub: "Quick questions to the Advisor", icon: Bot },
];
const KEY = "gev-widgets";
const DEFAULT: WidgetId[] = ["envs", "patterns", "tools"];

function Widget({ id, onRemove, to, children }: { id: WidgetId; onRemove: () => void; to?: string; children: React.ReactNode }) {
  const w = CATALOG.find((c) => c.id === id)!;
  return (
    <section className="panel p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="icon-tile"><w.icon className="size-4" /></div>
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight">{w.title}</h2>
          <p className="text-xs text-muted-foreground">{w.sub}</p>
        </div>
        {to && <Link to={to} className="text-muted-foreground hover:text-foreground" aria-label={`Open ${w.title}`}><ArrowRight className="size-4" /></Link>}
        <button onClick={onRemove} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${w.title}`}><X className="size-4" /></button>
      </div>
      {children}
    </section>
  );
}

function Home() {
  const envs = useEnvs();
  const [widgets, setWidgets] = useState<WidgetId[]>(DEFAULT);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setWidgets(JSON.parse(s)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const save = (w: WidgetId[]) => { setWidgets(w); localStorage.setItem(KEY, JSON.stringify(w)); };
  const remove = (id: WidgetId) => save(widgets.filter((w) => w !== id));
  const available = CATALOG.filter((c) => !widgets.includes(c.id));
  const pinned = FOLDERS.flatMap((f) => f.tools.slice(0, 2)).slice(0, 8);

  const render = (id: WidgetId) => {
    switch (id) {
      case "envs":
        return (
          <Widget key={id} id={id} onRemove={() => remove(id)} to="/environments">
            <div className="grid gap-3 sm:grid-cols-2">
              {envs.map((e) => (
                <div key={e.id} className="rounded-lg border bg-surface/50 p-4">
                  <div className="flex items-center justify-between"><span className="font-mono text-sm font-medium">{e.id}</span><StatusDot status={e.status} /></div>
                  <div className="mt-3 font-mono text-[13px]">{e.snapshot}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{e.by} · {timeAgo(e.when)}</div>
                  <div className="mt-3">
                    {e.notified
                      ? <span className="btn-done w-full justify-center"><CheckCircle2 className="size-3.5" />Notified</span>
                      : <button onClick={() => notifyManager(e.id)} className="btn-ghost w-full justify-center"><Send className="size-3.5" />Notify manager</button>}
                  </div>
                </div>
              ))}
            </div>
          </Widget>
        );
      case "patterns":
        return (
          <Widget key={id} id={id} onRemove={() => remove(id)} to="/rca/insights">
            <div className="space-y-1">
              {CLUSTERS.map((c) => (
                <button key={c.id} onClick={() => openAgent(c)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface">
                  <span className={c.severity === "critical" ? "size-2 rounded-full bg-destructive" : c.severity === "high" ? "size-2 rounded-full bg-warning" : "size-2 rounded-full bg-muted-foreground"} />
                  <span className="flex-1 truncate text-sm">{c.name}</span>
                  <span className="font-mono text-xs text-primary">{c.hoursSavable}h</span>
                </button>
              ))}
            </div>
          </Widget>
        );
      case "tools":
        return (
          <Widget key={id} id={id} onRemove={() => remove(id)} to="/tools">
            <div className="grid grid-cols-2 gap-1">
              {pinned.map((t) => (
                <a key={t.name} href={t.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-surface">
                  <span className="truncate">{t.name}</span><ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </div>
          </Widget>
        );
      case "trend":
        return (
          <Widget key={id} id={id} onRemove={() => remove(id)} to="/rca/insights">
            <div className="h-36">
              <ResponsiveContainer>
                <BarChart data={MONTHLY}>
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Bar dataKey="incidents" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Widget>
        );
      case "agent":
        return (
          <Widget key={id} id={id} onRemove={() => remove(id)}>
            <div className="flex flex-wrap gap-1.5">
              {["Which cluster should we fix first?", "Where is most time being lost?"].map((q) => (
                <button key={q} onClick={() => { openAgent(null); setTimeout(() => import("@/lib/agent-store").then((m) => m.ask(q)), 0); }} className="rounded-full border bg-surface px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary">{q}</button>
              ))}
            </div>
          </Widget>
        );
    }
  };

  return (
    <>
      <PageHeader
        title="Good morning, pihuvijay"
        sub="Everything you need today, in one place."
        action={
          <div className="flex items-center gap-2">
            <Link to="/rca" className="flex h-9 w-64 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground hover:border-primary/40">
              <Search className="size-4" />Search incidents…
              <kbd className="ml-auto rounded border bg-surface px-1.5 font-mono text-[10px]">⌘K</kbd>
            </Link>
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenu((m) => !m)} className="btn-primary"><Plus className="size-4" />Add widget</button>
              {menu && (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border bg-popover p-1.5 shadow-xl animate-in fade-in zoom-in-95">
                  {available.length === 0 && <p className="px-3 py-3 text-sm text-muted-foreground">All widgets are on your homepage.</p>}
                  {available.map((w) => (
                    <button key={w.id} onClick={() => { save([...widgets, w.id]); setMenu(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-surface">
                      <w.icon className="size-4 text-primary" />
                      <div><div className="text-sm font-medium">{w.title}</div><div className="text-xs text-muted-foreground">{w.sub}</div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
      />
      {widgets.length === 0
        ? <p className="panel px-5 py-12 text-center text-sm text-muted-foreground">No widgets yet — use “Add widget” to build your homepage.</p>
        : <div className="grid gap-5 lg:grid-cols-2">{widgets.map(render)}</div>}
    </>
  );
}
