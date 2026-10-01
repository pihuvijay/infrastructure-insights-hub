import { createFileRoute, Link } from "@tanstack/react-router";
import { Server, FolderTree, Lightbulb, Send, CheckCircle2, ArrowUpRight, Search, ArrowRight } from "lucide-react";
import { PageHeader, StatusDot } from "@/components/AppSidebar";
import { useEnvs, notifyManager } from "@/lib/env-store";
import { CLUSTERS, FOLDERS, timeAgo } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Homepage — InfraCore" },
      { name: "description", content: "Your personalised operations dashboard: environments, shortcuts and incident insights." },
      { property: "og:title", content: "Homepage — InfraCore" },
      { property: "og:description", content: "Your personalised operations dashboard." },
    ],
  }),
  component: Home,
});

function Widget({ icon: Icon, title, sub, to, children }: { icon: typeof Server; title: string; sub: string; to: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="icon-tile"><Icon className="size-4" /></div>
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        <Link to={to} className="text-muted-foreground hover:text-foreground" aria-label={`Open ${title}`}><ArrowRight className="size-4" /></Link>
      </div>
      {children}
    </section>
  );
}

function Home() {
  const envs = useEnvs();
  const pinned = FOLDERS.flatMap((f) => f.tools.slice(0, 2).map((t) => ({ ...t, folder: f.name }))).slice(0, 8);
  const saved = CLUSTERS.reduce((a, c) => a + c.hoursSavable, 0);

  return (
    <>
      <PageHeader
        title="Good morning, pihuvijay"
        sub="Everything you need today, in one place."
        action={
          <Link to="/rca" className="flex h-10 w-72 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground hover:border-primary/40">
            <Search className="size-4" />Search similar incidents…
            <kbd className="ml-auto rounded border bg-surface px-1.5 font-mono text-[10px]">⌘K</kbd>
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Widget icon={Server} title="Environment snapshots" sub="Notify your line manager in one click" to="/environments">
            <div className="grid gap-3 sm:grid-cols-2">
              {envs.map((e) => (
                <div key={e.id} className="rounded-lg border bg-surface/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-medium">{e.id}</span>
                    <StatusDot status={e.status} />
                  </div>
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
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Widget icon={Lightbulb} title="Incident patterns" sub={`${saved}h could be saved this quarter`} to="/rca/insights">
            <div className="space-y-2">
              {CLUSTERS.map((c) => (
                <Link key={c.id} to="/rca/insights" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface">
                  <span className={c.severity === "critical" ? "size-2 rounded-full bg-destructive" : c.severity === "high" ? "size-2 rounded-full bg-warning" : "size-2 rounded-full bg-muted-foreground"} />
                  <span className="flex-1 truncate text-sm">{c.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{c.incidents} inc</span>
                </Link>
              ))}
            </div>
          </Widget>

          <Widget icon={FolderTree} title="Tool shortcuts" sub="Your most-used links" to="/tools">
            <div className="grid grid-cols-2 gap-1">
              {pinned.map((t) => (
                <a key={t.name} href={t.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-surface">
                  <span className="truncate">{t.name}</span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary" />
                </a>
              ))}
            </div>
          </Widget>
        </div>
      </div>
    </>
  );
}
