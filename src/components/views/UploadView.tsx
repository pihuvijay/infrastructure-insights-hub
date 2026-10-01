"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Unplug,
  Upload,
  UploadCloud,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useConnectionActions, useConnections, useUploadFiles, useUploads } from "@/lib/queries";
import type { Connection, UploadStatus } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const ICONS = { servicenow: Database, box: Box } as const;
const statusCls: Record<UploadStatus, string> = {
  indexed: "text-primary",
  failed: "text-destructive",
  processing: "text-warning",
};

function UploadTab() {
  const { data: items = [] } = useUploads();
  const upload = useUploadFiles();
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const send = (list: FileList | null) => list?.length && upload.mutate(Array.from(list));
  const count = (s: UploadStatus) => items.filter((i) => i.status === s).length;
  const stats = [
    {
      label: "Indexed",
      n: count("indexed"),
      icon: CheckCircle2,
      cls: "bg-primary-soft text-primary",
    },
    {
      label: "Processing",
      n: count("processing"),
      icon: Clock,
      cls: "bg-warning-soft text-warning",
    },
    {
      label: "Failed",
      n: count("failed"),
      icon: AlertTriangle,
      cls: "bg-destructive-soft text-destructive",
    },
  ];

  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          send(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center rounded-xl border border-dashed bg-card px-6 py-12 transition",
          over ? "border-primary bg-primary-soft" : "hover:border-primary/40",
        )}
      >
        <div className="icon-tile size-12">
          <UploadCloud className="size-5" />
        </div>
        <div className="mt-4 font-medium">Drop files</div>
        <div className="mt-1 text-sm text-muted-foreground">or click to browse</div>
        <input
          ref={ref}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            send(e.target.files);
            e.target.value = "";
          }}
        />
      </button>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="panel flex items-center gap-4 p-5">
            <div className={cn("grid size-10 place-items-center rounded-lg", s.cls)}>
              <s.icon className="size-4.5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-semibold tabular-nums">{s.n}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="panel mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="font-medium">Recent uploads</h2>
          <span className="font-mono text-xs text-muted-foreground">{items.length} total</span>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">No uploads yet.</p>
        ) : (
          <ul>
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 border-b px-5 py-3 last:border-0">
                <FileText className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{i.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(i.size / 1024).toFixed(0)} KB
                </span>
                <span
                  className={cn(
                    "inline-flex w-24 items-center justify-end gap-1.5 font-mono text-[11px] uppercase",
                    statusCls[i.status],
                  )}
                >
                  {i.status === "processing" && <Loader2 className="size-3 animate-spin" />}
                  {i.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function ConnectionCard({ c }: { c: Connection }) {
  const { connect, sync, disconnect } = useConnectionActions();
  const Icon = ICONS[c.id];
  const pending = c.status === "connecting" || c.status === "syncing";
  const live = c.status === "connected" || c.status === "syncing";
  return (
    <div className="panel p-5">
      <div className="flex items-start gap-4">
        <div className="icon-tile size-11">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">{c.name}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider",
                c.status === "connected"
                  ? "text-primary"
                  : pending
                    ? "text-warning"
                    : "text-muted-foreground",
              )}
            >
              {pending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
              {c.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
          {live && (
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="eyebrow">Account</dt>
                <dd className="mt-1 truncate font-mono text-[13px]">{c.account}</dd>
              </div>
              <div>
                <dt className="eyebrow">Scope</dt>
                <dd className="mt-1 text-[13px]">{c.scope}</dd>
              </div>
              <div>
                <dt className="eyebrow">Last sync</dt>
                <dd className="mt-1 text-[13px]">
                  {c.lastSync ? `${timeAgo(c.lastSync)} · ${c.records} records` : "In progress…"}
                </dd>
              </div>
            </dl>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {live ? (
            <>
              <button
                onClick={() => sync.mutate(c.id)}
                disabled={pending}
                className="btn-ghost disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3.5", c.status === "syncing" && "animate-spin")} />
                Sync now
              </button>
              <button
                onClick={() => disconnect.mutate(c.id)}
                disabled={pending}
                className="btn-ghost disabled:opacity-50"
              >
                <Unplug className="size-3.5" />
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => connect.mutate(c.id)}
              disabled={pending}
              className="btn-primary disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Connect {c.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectTab() {
  const { data = [], isLoading } = useConnections();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sign in once. We discover the right projects and folders, then keep RCA in sync — nothing to
        fill in.
      </p>
      {isLoading && (
        <p className="panel px-5 py-12 text-center text-sm text-muted-foreground">
          Loading sources…
        </p>
      )}
      {data.map((c) => (
        <ConnectionCard key={c.id} c={c} />
      ))}
    </div>
  );
}

const TABS = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "connect", label: "Connect", icon: Link2 },
] as const;

export function UploadView() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("upload");
  return (
    <>
      <PageHeader title="RCA Upload" />
      <div className="mb-5 inline-flex rounded-lg border bg-surface p-0.5" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition",
              tab === t.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>
      {tab === "upload" ? <UploadTab /> : <ConnectTab />}
    </>
  );
}
