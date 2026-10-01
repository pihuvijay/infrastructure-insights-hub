"use client";

import { useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowUp,
  FileText,
  Loader2,
  Paperclip,
  Sparkles,
  UserCheck,
  Wrench,
  X,
  Search,
  GitCompareArrows,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { IncidentCard } from "@/components/rca/IncidentCard";
import { FollowUp } from "@/components/rca/FollowUp";
import { api } from "@/lib/api";
import { useFilterOptions } from "@/lib/queries";
import type { DateRange, SearchFilters, SearchTask } from "@/lib/types";
import { cn } from "@/lib/utils";

const TASKS: { id: SearchTask; label: string; icon: typeof Search; placeholder: string }[] = [
  {
    id: "similar",
    label: "Find similar incidents",
    icon: GitCompareArrows,
    placeholder: "Describe the symptom, e.g. API 5xx after driver upgrade",
  },
  {
    id: "resolvers",
    label: "Who resolved them",
    icon: UserCheck,
    placeholder: "What issue should I find resolvers for?",
  },
  {
    id: "root_cause",
    label: "Root causes",
    icon: Sparkles,
    placeholder: "Which incident or symptom should I trace?",
  },
  {
    id: "fix",
    label: "Suggest a fix",
    icon: Wrench,
    placeholder: "What problem do you need to fix?",
  },
];
const RANGES: { id: DateRange; label: string }[] = [
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "1y", label: "Past year" },
  { id: "all", label: "All time" },
];
const DEFAULT_FILTERS: SearchFilters = {
  range: "1y",
  project: "all",
  source: "all",
  status: "all",
  resolvedBy: "all",
};

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 rounded-lg border bg-surface px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
          value !== "all" && "border-primary/40 text-primary",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SearchView() {
  const { data: opts } = useFilterOptions();
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [task, setTask] = useState<SearchTask>("similar");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [committed, setCommitted] = useState({
    query: "",
    task: "similar" as SearchTask,
    files: [] as File[],
    n: 0,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isFetching, error } = useQuery({
    queryKey: [
      "search",
      committed.query,
      committed.task,
      committed.files.map((f) => `${f.name}:${f.size}`),
      filters,
      committed.n,
    ],
    queryFn: () =>
      api.search({ query: committed.query, task: committed.task, filters }, committed.files),
    placeholderData: keepPreviousData,
  });

  const hasIntent = !!committed.query.trim() || committed.files.length > 0;
  const taskDef = TASKS.find((t) => t.id === task)!;
  const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  const setF = <K extends keyof SearchFilters>(k: K, v: SearchFilters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));
  const incidentIds = useMemo(() => (data?.incidents ?? []).slice(0, 6).map((i) => i.id), [data]);
  const canSubmit = !!text.trim() || files.length > 0;

  const submit = () => canSubmit && setCommitted((c) => ({ query: text, task, files, n: c.n + 1 }));

  return (
    <>
      <PageHeader title="RCA Search" />

      <section className="panel p-4">
        <div className="flex flex-wrap gap-1.5">
          {TASKS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTask(t.id)}
              aria-pressed={task === t.id}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition",
                task === t.id
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-3 rounded-xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring"
        >
          <textarea
            autoFocus
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={taskDef.placeholder}
            className="w-full resize-none bg-transparent px-2 py-1.5 text-[15px] placeholder:text-muted-foreground focus:outline-none"
          />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1.5 pb-1.5">
              {files.map((f, idx) => (
                <span
                  key={`${f.name}-${idx}`}
                  className="inline-flex items-center gap-1.5 rounded-md border bg-surface px-2 py-1 text-xs"
                >
                  <FileText className="size-3 text-primary" />
                  {f.name}
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles(files.filter((_, j) => j !== idx))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between px-1">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost">
              <Paperclip className="size-3.5" />
              Attach logs or tickets
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) setFiles((p) => [...p, ...Array.from(e.target.files!)]);
                e.target.value = "";
              }}
            />
            <button disabled={!canSubmit} className="btn-primary h-8 disabled:opacity-40">
              {isFetching && hasIntent ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
              Ask agent
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div
            className="flex rounded-lg border bg-surface p-0.5"
            role="group"
            aria-label="Date range"
          >
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setF("range", r.id)}
                aria-pressed={filters.range === r.id}
                className={cn(
                  "h-7 rounded-md px-2.5 text-xs transition",
                  filters.range === r.id
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Select
            label="Project"
            value={filters.project}
            onChange={(v) => setF("project", v)}
            options={[
              { value: "all", label: "All" },
              ...(opts?.projects ?? []).map((p) => ({ value: p, label: p })),
            ]}
          />
          <Select
            label="Source"
            value={filters.source}
            onChange={(v) => setF("source", v as SearchFilters["source"])}
            options={[
              { value: "all", label: "All" },
              { value: "ServiceNow", label: "ServiceNow" },
              { value: "Box", label: "Box" },
              { value: "Upload", label: "Uploads" },
            ]}
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(v) => setF("status", v as SearchFilters["status"])}
            options={[
              { value: "all", label: "Any" },
              { value: "resolved", label: "Resolved" },
              { value: "workaround", label: "Workaround" },
              { value: "open", label: "Open" },
            ]}
          />
          <Select
            label="Resolved by"
            value={filters.resolvedBy}
            onChange={(v) => setF("resolvedBy", v)}
            options={[
              { value: "all", label: "Anyone" },
              ...(opts?.people ?? []).map((p) => ({ value: p, label: p })),
            ]}
          />
          {dirty && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-lg bg-destructive-soft px-4 py-3 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      {hasIntent ? (
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="panel p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="icon-tile size-8">
                <Sparkles className="size-4" />
              </div>
              <div className="eyebrow text-primary">Advisor · {taskDef.label}</div>
            </div>
            {isFetching && !data?.answer ? (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching incidents…
              </p>
            ) : (
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed transition-opacity",
                  isFetching && "opacity-50",
                )}
              >
                {data?.answer}
              </p>
            )}
            {data?.cluster && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary-soft p-3.5">
                <div className="eyebrow text-primary">
                  Likely pattern · {data.cluster.incidents} incidents overall
                </div>
                <div className="mt-1 text-sm font-medium">{data.cluster.name}</div>
                <p className="mt-1 text-[13px] text-muted-foreground">{data.cluster.fix}</p>
              </div>
            )}
            <FollowUp
              key={committed.n}
              incidentIds={incidentIds}
              clusterId={data?.cluster?.id ?? null}
            />
          </section>

          <aside
            className="animate-in fade-in slide-in-from-right-4 space-y-2.5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
            aria-label="Related incidents"
          >
            <div className="eyebrow">{data?.incidents.length ?? 0} related incidents</div>
            {data?.incidents.length === 0 && (
              <p className="panel px-4 py-8 text-center text-sm text-muted-foreground">
                No incidents match these filters.
              </p>
            )}
            {data?.incidents.map((i) => (
              <IncidentCard key={i.id} i={i} showScore compact />
            ))}
          </aside>
        </div>
      ) : (
        <div className="mt-6 space-y-2.5">
          <div className="eyebrow">{data?.incidents.length ?? 0} incidents match your filters</div>
          {data?.incidents.length === 0 && (
            <p className="panel px-4 py-10 text-center text-sm text-muted-foreground">
              No incidents match these filters.
            </p>
          )}
          {data?.incidents.map((i) => (
            <IncidentCard key={i.id} i={i} showScore={false} />
          ))}
        </div>
      )}
    </>
  );
}
