import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles, FileText, Ticket } from "lucide-react";
import { PageHeader } from "@/components/AppSidebar";
import { INCIDENTS, CLUSTERS } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rca/")({
  head: () => ({
    meta: [
      { title: "RCA Search — GEV System Delivery" },
      { name: "description", content: "Describe a symptom and find similar past incidents across ServiceNow and Box." },
      { property: "og:title", content: "RCA Search — GEV System Delivery" },
      { property: "og:description", content: "Find similar incidents and their root causes." },
    ],
  }),
  component: RcaSearch,
});

const SUGGESTIONS = ["connection pool exhausted", "TLS handshake failing", "disk full on restore"];

function score(q: string, text: string) {
  const words = q.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (!words.length) return 0;
  const t = text.toLowerCase();
  return words.filter((w) => t.includes((w ?? "").slice(0, 5))).length / words.length;
}

function RcaSearch() {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<"All" | "ServiceNow" | "Box">("All");
  const results = useMemo(() => {
    return INCIDENTS
      .filter((i) => source === "All" || i.source === source)
      .map((i) => ({ ...i, s: q ? score(q, `${i.title} ${i.rootCause} ${i.resolution}`) : 0 }))
      .filter((i) => !q || i.s > 0)
      .sort((a, b) => b.s - a.s);
  }, [q, source]);
  const topCluster = q && results[0] ? CLUSTERS.find((c) => c.id === results[0].cluster) : undefined;

  return (
    <>
      <PageHeader title="RCA Search" sub="Describe what you're seeing. We'll surface similar incidents and how they were fixed." />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input autoFocus className="input h-14 rounded-xl pl-12 text-base" placeholder="e.g. API 5xx after driver upgrade" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(["All", "ServiceNow", "Box"] as const).map((s) => (
          <button key={s} onClick={() => setSource(s)} className={cn("h-7 rounded-full border px-3 text-xs", source === s ? "border-primary/40 bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground")}>{s}</button>
        ))}
        <span className="mx-2 h-4 w-px bg-border" />
        {SUGGESTIONS.map((s) => <button key={s} onClick={() => setQ(s)} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">{s}</button>)}
      </div>

      {topCluster && (
        <div className="panel mt-6 flex gap-4 border-primary/30 p-5">
          <div className="icon-tile shrink-0"><Sparkles className="size-4" /></div>
          <div>
            <div className="eyebrow text-primary">Likely pattern · {topCluster.incidents} similar incidents</div>
            <div className="mt-1 font-medium">{topCluster.name}</div>
            <p className="mt-1 text-sm text-muted-foreground">{topCluster.summary}</p>
            <p className="mt-2 text-sm"><span className="text-muted-foreground">Suggested fix: </span>{topCluster.fix}</p>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2.5">
        <div className="eyebrow">{results.length} {q ? "matches" : "recent incidents"}</div>
        {results.map((i) => (
          <article key={i.id} className="panel p-5 transition hover:border-primary/30">
            <div className="flex items-start gap-3">
              {i.source === "Box" ? <FileText className="mt-0.5 size-4 text-muted-foreground" /> : <Ticket className="mt-0.5 size-4 text-muted-foreground" />}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-medium">{i.title}</h3>
                  <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
                </div>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="eyebrow">Root cause</dt><dd className="mt-1">{i.rootCause}</dd></div>
                  <div><dt className="eyebrow">Resolution</dt><dd className="mt-1">{i.resolution}</dd></div>
                </dl>
                <div className="mt-3 text-xs text-muted-foreground">{i.owner} · {i.date} · {i.hours}h to resolve</div>
              </div>
              {q && <span className="font-mono text-sm text-primary">{Math.round(i.s * 100)}%</span>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
