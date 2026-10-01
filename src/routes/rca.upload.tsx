import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Database, Box, FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rca/upload")({
  head: () => ({
    meta: [
      { title: "RCA Upload — InfraCore" },
      { name: "description", content: "Drop ServiceNow exports or Box documents to index them for root cause analysis." },
      { property: "og:title", content: "RCA Upload — InfraCore" },
      { property: "og:description", content: "Index incident documents for RCA search." },
    ],
  }),
  component: Upload,
});

type Item = { id: string; name: string; source: "ServiceNow" | "Box"; size: number; status: "processing" | "indexed" | "failed" };

function Drop({ source, icon: Icon, onFiles }: { source: Item["source"]; icon: typeof Box; onFiles: (f: FileList, s: Item["source"]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <button
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files, source); }}
      className={cn("flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-10 transition", over ? "border-primary bg-primary-soft" : "hover:border-primary/40")}
    >
      <div className="icon-tile size-12"><Icon className="size-5" /></div>
      <div className="mt-4 font-medium">Drop {source} {source === "Box" ? "documents" : "exports"}</div>
      <div className="mt-1 text-sm text-muted-foreground">JSON, CSV, PDF, logs — or click to browse</div>
      <input ref={ref} type="file" multiple hidden onChange={(e) => e.target.files && onFiles(e.target.files, source)} />
    </button>
  );
}

function Upload() {
  const [items, setItems] = useState<Item[]>([]);
  const onFiles = (files: FileList, source: Item["source"]) => {
    const added = Array.from(files).map((f) => ({ id: crypto.randomUUID(), name: f.name, size: f.size, source, status: "processing" as const }));
    setItems((p) => [...added, ...p]);
    added.forEach((a) => setTimeout(() => setItems((p) => p.map((i) => (i.id === a.id ? { ...i, status: a.size > 20e6 ? "failed" : "indexed" } : i))), 1200 + Math.random() * 1800));
  };
  const count = (s: Item["status"]) => items.filter((i) => i.status === s).length;
  const stats = [
    { label: "Indexed", n: count("indexed"), icon: CheckCircle2, cls: "bg-primary-soft text-primary" },
    { label: "Processing", n: count("processing"), icon: Clock, cls: "bg-warning-soft text-warning" },
    { label: "Failed", n: count("failed"), icon: AlertTriangle, cls: "bg-destructive-soft text-destructive" },
  ];

  return (
    <>
      <PageHeader title="RCA Upload" sub="Drop ServiceNow exports or Box documents. They're chunked and indexed for search and pattern detection." />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="panel flex items-center gap-4 p-5">
            <div className={cn("grid size-10 place-items-center rounded-lg", s.cls)}><s.icon className="size-4.5" /></div>
            <div><div className="text-sm text-muted-foreground">{s.label}</div><div className="text-2xl font-semibold tabular-nums">{s.n}</div></div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Drop source="ServiceNow" icon={Database} onFiles={onFiles} />
        <Drop source="Box" icon={Box} onFiles={onFiles} />
      </div>

      <section className="panel mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="font-medium">Recent uploads</h2>
          <span className="font-mono text-xs text-muted-foreground">{items.length} total</span>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">No uploads yet — drop a file above to get started.</p>
        ) : (
          <ul>
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 border-b px-5 py-3 last:border-0">
                <FileText className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{i.name}</span>
                <span className="text-xs text-muted-foreground">{i.source} · {(i.size / 1024).toFixed(0)} KB</span>
                <span className={cn("inline-flex w-24 items-center justify-end gap-1.5 font-mono text-[11px] uppercase", i.status === "indexed" ? "text-primary" : i.status === "failed" ? "text-destructive" : "text-warning")}>
                  {i.status === "processing" && <Loader2 className="size-3 animate-spin" />}{i.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
