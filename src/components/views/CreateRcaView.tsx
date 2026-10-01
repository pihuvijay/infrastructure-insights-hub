"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FilePlus2,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { FilterMenu } from "@/components/FilterMenu";
import { PageHeader } from "@/components/PageHeader";
import { RcaSidePanel } from "@/components/rca/RcaSidePanel";
import { RowActions } from "@/components/rca/RowActions";
import { useSnowIncidents } from "@/lib/queries";
import type { Priority, RcaStatus } from "@/lib/types";
import { NOW, cn } from "@/lib/utils";

const DAY = 86_400_000;
const STATUS: { value: RcaStatus; label: string }[] = [
  { value: "none", label: "Needs RCA" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "In Box" },
];
const PRIORITIES = ["P1", "P2", "P3", "P4"].map((p) => ({ value: p, label: p }));
const TIME: { value: string; label: string; test: (h: number) => boolean }[] = [
  { value: "lt2", label: "Under 2h", test: (h) => h < 2 },
  { value: "2-4", label: "2–4h", test: (h) => h >= 2 && h < 4 },
  { value: "4-8", label: "4–8h", test: (h) => h >= 4 && h < 8 },
  { value: "gt8", label: "8h or more", test: (h) => h >= 8 },
];
const DATES = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last year" },
];
const statusCls: Record<RcaStatus, string> = {
  none: "bg-destructive-soft text-destructive",
  draft: "bg-warning-soft text-warning",
  published: "bg-primary-soft text-primary",
};
const statusLabel = Object.fromEntries(STATUS.map((s) => [s.value, s.label])) as Record<
  RcaStatus,
  string
>;
const prioCls: Record<Priority, string> = {
  P1: "text-destructive",
  P2: "text-warning",
  P3: "text-foreground",
  P4: "text-muted-foreground",
};
const fmt = (iso: string) => iso.slice(0, 10);

function StatusChip({ status }: { status: RcaStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
        statusCls[status],
      )}
    >
      {status === "published" ? (
        <CheckCircle2 className="size-3" />
      ) : status === "draft" ? (
        <FileText className="size-3" />
      ) : (
        <FilePlus2 className="size-3" />
      )}
      {statusLabel[status]}
    </span>
  );
}

export function CreateRcaView() {
  const { data = [], isLoading, error } = useSnowIncidents();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [priority, setPriority] = useState<string[]>([]);
  const [assignee, setAssignee] = useState<string[]>([]);
  const [time, setTime] = useState<string[]>([]);
  const [date, setDate] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [newestFirst, setNewestFirst] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const people = useMemo(
    () => [...new Set(data.map((i) => i.resolvedBy))].sort().map((p) => ({ value: p, label: p })),
    [data],
  );
  const active =
    [status, priority, assignee, time, date].some((f) => f.length) || !!q || !!from || !!to;
  const clear = () => {
    setQ("");
    setStatus([]);
    setPriority([]);
    setAssignee([]);
    setTime([]);
    setDate([]);
    setFrom("");
    setTo("");
  };

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const min = date[0] ? NOW - Number(date[0]) * DAY : -Infinity;
    return data
      .filter((i) => !status.length || status.includes(i.rcaStatus))
      .filter((i) => !priority.length || priority.includes(i.priority))
      .filter((i) => !assignee.length || assignee.includes(i.resolvedBy))
      .filter(
        (i) => !time.length || TIME.some((t) => time.includes(t.value) && t.test(i.hoursToResolve)),
      )
      .filter((i) => Date.parse(i.opened) >= min)
      .filter((i) => !from || i.opened.slice(0, 10) >= from)
      .filter((i) => !to || i.opened.slice(0, 10) <= to)
      .filter(
        (i) => !s || `${i.number} ${i.shortDescription} ${i.project}`.toLowerCase().includes(s),
      )
      .sort((a, b) =>
        newestFirst ? b.opened.localeCompare(a.opened) : a.opened.localeCompare(b.opened),
      );
  }, [data, q, status, priority, assignee, time, date, from, to, newestFirst]);

  const compact = !!selected;
  const th = "eyebrow px-3 py-3 text-left font-normal";

  return (
    <div
      className={cn("transition-[padding] duration-200", compact && "xl:pr-[calc(50vw-1.5rem)]")}
    >
      <PageHeader title="Create RCA" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="input h-9 pl-10"
            placeholder="Search"
            aria-label="Search incidents"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <FilterMenu label="Status" options={STATUS} value={status} onChange={setStatus} />
        <FilterMenu label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
        <FilterMenu label="Assignee" options={people} value={assignee} onChange={setAssignee} />
        <FilterMenu label="Time taken" options={TIME} value={time} onChange={setTime} />
        <FilterMenu label="Opened" options={DATES} value={date} onChange={setDate} single>
          <div className="mt-1 space-y-2 border-t px-2.5 pb-1.5 pt-2.5">
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 rounded-md border bg-surface px-2 text-xs text-foreground"
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 rounded-md border bg-surface px-2 text-xs text-foreground"
              />
            </label>
          </div>
        </FilterMenu>
        {active && (
          <button
            onClick={clear}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        )}
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {rows.length} of {data.length}
        </span>
      </div>

      <div className="panel overflow-x-auto">
        <table className={cn("w-full text-sm", compact && "table-fixed")}>
          <thead>
            <tr className="border-b">
              {!compact && <th className={th}>Incident</th>}
              <th className={th}>Description</th>
              {!compact && <th className={th}>Priority</th>}
              {!compact && (
                <th className={th}>
                  <button
                    onClick={() => setNewestFirst((v) => !v)}
                    className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                    aria-label="Toggle sort order"
                  >
                    Opened{" "}
                    {newestFirst ? (
                      <ArrowDown className="size-3" />
                    ) : (
                      <ArrowUp className="size-3" />
                    )}
                  </button>
                </th>
              )}
              {!compact && <th className={th}>Resolved</th>}
              {!compact && <th className={cn(th, "text-right")}>Time</th>}
              {!compact && <th className={th}>Assignee</th>}
              {!compact && <th className={th}>RCA</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                  <Loader2 className="mr-2 inline size-4 animate-spin" />
                  Loading…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-destructive">
                  {(error as Error).message}
                </td>
              </tr>
            )}
            {!isLoading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                  No incidents match.
                </td>
              </tr>
            )}
            {rows.map((i) => (
              <tr
                key={i.number}
                onClick={() => setSelected(i.number)}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelected(i.number)}
                aria-selected={selected === i.number}
                className={cn(
                  "cursor-pointer border-b last:border-0 hover:bg-surface/40 focus-visible:bg-surface/40 focus-visible:outline-none",
                  selected === i.number && "bg-primary-soft hover:bg-primary-soft",
                )}
              >
                {!compact && (
                  <td className="px-3 py-3.5 font-mono text-[13px] text-primary">{i.number}</td>
                )}
                <td className="px-3 py-3.5">
                  {compact && (
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-[13px] text-primary">{i.number}</span>
                      <StatusChip status={i.rcaStatus} />
                    </div>
                  )}
                  <div className="truncate font-medium">{i.shortDescription}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {compact && (
                      <span className={cn("mr-2 font-mono", prioCls[i.priority])}>
                        {i.priority}
                      </span>
                    )}
                    {i.project}
                  </div>
                  <RowActions number={i.number} onEdit={() => setSelected(i.number)} />
                </td>
                {!compact && (
                  <td
                    className={cn(
                      "px-3 py-3.5 font-mono text-[13px] font-medium",
                      prioCls[i.priority],
                    )}
                  >
                    {i.priority}
                  </td>
                )}
                {!compact && (
                  <td className="whitespace-nowrap px-3 py-3.5 text-[13px] text-muted-foreground">
                    {fmt(i.opened)}
                  </td>
                )}
                {!compact && (
                  <td className="whitespace-nowrap px-3 py-3.5 text-[13px] text-muted-foreground">
                    {fmt(i.resolved)}
                  </td>
                )}
                {!compact && (
                  <td className="px-3 py-3.5 text-right font-mono text-[13px] tabular-nums">
                    {i.hoursToResolve}h
                  </td>
                )}
                {!compact && (
                  <td className="whitespace-nowrap px-3 py-3.5 text-[13px] text-muted-foreground">
                    {i.resolvedBy}
                  </td>
                )}
                {!compact && (
                  <td className="px-3 py-3.5">
                    <StatusChip status={i.rcaStatus} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <RcaSidePanel key={selected} number={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
