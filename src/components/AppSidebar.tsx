"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@/components/images/gev-mark.png";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus,
  Rocket,
  LayoutGrid,
  FilePlus2,
  Search,
  Upload,
  Lightbulb,
  Server,
  FolderTree,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const item =
  "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] text-muted-foreground transition hover:bg-surface hover:text-foreground";
const active =
  "bg-surface text-foreground before:absolute before:left-0 before:top-2 before:h-5 before:w-[3px] before:rounded-full before:bg-primary [&_svg]:text-primary";

export function AppSidebar() {
  const path = usePathname();
  const [rcaOpen, setRcaOpen] = useState(path.startsWith("/rca"));
  const router = useRouter();
  const [release, setReleaseState] = useState(false);
  useEffect(() => setReleaseState(localStorage.getItem("sidebar:build-release") === "1"), []);
  const setRelease = (v: boolean) => {
    localStorage.setItem("sidebar:build-release", v ? "1" : "0");
    setReleaseState(v);
  };
  const is = (p: string) => path === p;

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-3 px-5 py-5">
        <Image src={logo} alt="GEV" priority className="size-10 rounded-full" />
        <div className="text-sm font-semibold leading-tight tracking-tight">System Delivery</div>
      </div>

      <nav className="flex-1 space-y-6 px-3 pt-2">
        <div className="space-y-0.5">
          <Link href="/" className={cn(item, is("/") && active)}>
            <LayoutGrid className="size-4" />
            Homepage
          </Link>

          <button
            onClick={() => setRcaOpen((o) => !o)}
            className={cn(item, "w-full", path.startsWith("/rca") && "text-foreground")}
          >
            <Search className="size-4" />
            RCA
            <ChevronDown className={cn("ml-auto size-3.5 transition", rcaOpen && "rotate-180")} />
          </button>
          {rcaOpen && (
            <div className="ml-5 space-y-0.5 border-l pl-2">
              <Link href="/rca/insights" className={cn(item, "h-8", is("/rca/insights") && active)}>
                <Lightbulb className="size-3.5" />
                Insights
              </Link>
              <Link
                href="/rca/create"
                className={cn(item, "h-8", path.startsWith("/rca/create") && active)}
              >
                <FilePlus2 className="size-3.5" />
                Create RCA
              </Link>
              <Link href="/rca" className={cn(item, "h-8", is("/rca") && active)}>
                <Search className="size-3.5" />
                Search
              </Link>
            </div>
          )}

          <Link href="/environments" className={cn(item, is("/environments") && active)}>
            <Server className="size-4" />
            Environments
          </Link>
          <Link href="/tools" className={cn(item, is("/tools") && active)}>
            <FolderTree className="size-4" />
            Tools
          </Link>
          {release ? (
            <Link href="/build-release" className={cn(item, is("/build-release") && active)}>
              <Rocket className="size-4" />
              Build Release Progress
            </Link>
          ) : (
            <button
              onClick={() => {
                setRelease(true);
                router.push("/build-release");
              }}
              aria-label="Add Build Release Progress"
              className={cn(item, "w-full opacity-50 hover:opacity-100")}
            >
              <Rocket className="size-4" />
              Build Release Progress
              <Plus className="ml-auto size-3" />
            </button>
          )}
        </div>
        <div className="space-y-0.5">
          <Link href="/rca/upload" className={cn(item, is("/rca/upload") && active)}>
            <Upload className="size-4" />
            Data sources
          </Link>
          <Link href="/admin" className={cn(item, is("/admin") && active)}>
            <Settings className="size-4" />
            Settings
          </Link>
        </div>
      </nav>

      <div className="flex items-center gap-3 border-t px-5 py-4">
        <div className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
          P
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-medium">pihuvijay</div>
          <div className="truncate text-xs text-muted-foreground">pihuvijay06@gmail.com</div>
        </div>
        <button aria-label="Sign out" className="text-muted-foreground hover:text-foreground">
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  );
}
