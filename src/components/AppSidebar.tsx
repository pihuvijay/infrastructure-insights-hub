import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Search, Upload, Lightbulb, Server, FolderTree, Settings, ShieldCheck, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const item = "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] text-muted-foreground transition hover:bg-surface hover:text-foreground";
const active = "bg-surface text-foreground before:absolute before:left-0 before:top-2 before:h-5 before:w-[3px] before:rounded-full before:bg-primary [&_svg]:text-primary";

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [rcaOpen, setRcaOpen] = useState(path.startsWith("/rca"));
  const is = (p: string) => path === p;

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="icon-tile"><ShieldCheck className="size-4.5" /></div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">InfraCore</div>
          <div className="text-xs text-muted-foreground">Operations hub</div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 px-3 pt-2">
        <div className="space-y-0.5">
          <div className="eyebrow px-3 pb-2">Operations</div>
          <Link to="/" className={cn(item, is("/") && active)}><LayoutGrid className="size-4" />Homepage</Link>

          <button onClick={() => setRcaOpen((o) => !o)} className={cn(item, "w-full", path.startsWith("/rca") && "text-foreground")}>
            <Search className="size-4" />RCA
            <ChevronDown className={cn("ml-auto size-3.5 transition", rcaOpen && "rotate-180")} />
          </button>
          {rcaOpen && (
            <div className="ml-5 space-y-0.5 border-l pl-2">
              <Link to="/rca" className={cn(item, "h-8", is("/rca") && active)}><Search className="size-3.5" />Search</Link>
              <Link to="/rca/upload" className={cn(item, "h-8", is("/rca/upload") && active)}><Upload className="size-3.5" />Upload</Link>
              <Link to="/rca/insights" className={cn(item, "h-8", is("/rca/insights") && active)}><Lightbulb className="size-3.5" />Insights</Link>
            </div>
          )}

          <Link to="/environments" className={cn(item, is("/environments") && active)}><Server className="size-4" />Environment Tracker</Link>
          <Link to="/tools" className={cn(item, is("/tools") && active)}><FolderTree className="size-4" />Tools & Onboarding</Link>
        </div>
        <div className="space-y-0.5">
          <div className="eyebrow px-3 pb-2">Preferences</div>
          <Link to="/admin" className={cn(item, is("/admin") && active)}><Settings className="size-4" />Admin Settings</Link>
        </div>
      </nav>

      <div className="flex items-center gap-3 border-t px-5 py-4">
        <div className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">P</div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-medium">pihuvijay</div>
          <div className="truncate text-xs text-muted-foreground">pihuvijay06@gmail.com</div>
        </div>
        <button aria-label="Sign out" className="text-muted-foreground hover:text-foreground"><LogOut className="size-4" /></button>
      </div>
    </aside>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) {
  return (
    <header className="mb-8 flex items-end justify-between gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-muted-foreground">{sub}</p>
      </div>
      {action}
    </header>
  );
}

export function StatusDot({ status }: { status: "synced" | "stale" }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider", status === "synced" ? "text-primary" : "text-warning")}>
      <span className="size-1.5 rounded-full bg-current" />{status}
    </span>
  );
}
