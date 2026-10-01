"use client";

import { useMemo, useState } from "react";
import { Search, ChevronRight, Folder, FolderOpen, ArrowUpRight, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useFolders } from "@/lib/queries";
import type { Folder as FolderT } from "@/lib/types";
import { cn } from "@/lib/utils";

function exportBookmarks(folders: FolderT[]) {
  const body = folders
    .map(
      (f) =>
        `<DT><H3>${f.name}</H3>\n<DL><p>\n${f.tools.map((t) => `<DT><A HREF="${t.url}">${t.name}</A>`).join("\n")}\n</DL><p>`,
    )
    .join("\n");
  const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<TITLE>GEV System Delivery</TITLE><H1>GEV System Delivery</H1>\n<DL><p>\n${body}\n</DL><p>`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  a.download = "gev-bookmarks.html";
  a.click();
}

export function ToolsView() {
  const { data: folders = [] } = useFolders();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string[]>(["Admin"]);
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return folders
      .map((f) => ({
        ...f,
        tools: f.tools.filter((t) => !s || (t.name + t.desc).toLowerCase().includes(s)),
      }))
      .filter((f) => f.tools.length);
  }, [q, folders]);
  const toggle = (n: string) =>
    setOpen((o) => (o.includes(n) ? o.filter((x) => x !== n) : [...o, n]));

  return (
    <>
      <PageHeader title="Tools & Onboarding" />

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input h-11 pl-10"
          placeholder="Search tools across all folders…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="space-y-2.5">
        {filtered.map((f) => {
          const isOpen = !!q || open.includes(f.name);
          const Icon = isOpen ? FolderOpen : Folder;
          return (
            <section key={f.name} className="panel overflow-hidden">
              <button
                onClick={() => toggle(f.name)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-surface/40"
              >
                <ChevronRight
                  className={cn("size-4 text-muted-foreground transition", isOpen && "rotate-90")}
                />
                <Icon
                  className={cn("size-4.5", isOpen ? "text-primary" : "text-muted-foreground")}
                />
                <span className="flex-1 font-medium">{f.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {f.tools.length} links
                </span>
              </button>
              {isOpen && (
                <div className="grid gap-2 border-t p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {f.tools.map((t) => (
                    <a
                      key={t.name}
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-start justify-between rounded-lg border bg-surface/40 p-3.5 transition hover:border-primary/40"
                    >
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                      <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary" />
                    </a>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed p-5">
        <div>
          <div className="font-medium">Onboarding pack</div>
          <div className="text-sm text-muted-foreground">
            Download every folder as a Chrome-importable bookmarks file.
          </div>
        </div>
        <button onClick={() => exportBookmarks(folders)} className="btn-ghost h-9">
          <Download className="size-4" />
          Export bookmarks
        </button>
      </div>
    </>
  );
}
