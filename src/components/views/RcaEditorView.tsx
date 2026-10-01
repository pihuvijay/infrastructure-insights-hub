"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileEdit,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useFilterOptions } from "@/lib/queries";
import { STATES, todo, useRcaDoc, type TextField } from "@/lib/use-rca-doc";
import type { ActionRow, SnowIncidentDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => iso.replace("T", " ").slice(0, 16);

function Chip({ kind }: { kind: "ai" | "todo" }) {
  return kind === "ai" ? (
    <span className="ml-2 inline-flex items-center gap-1 rounded bg-primary-soft px-1.5 py-0.5 align-middle font-mono text-[9.5px] uppercase tracking-wider text-primary">
      <Sparkles className="size-2.5" />
      ServiceNow
    </span>
  ) : (
    <span className="ml-2 rounded bg-warning-soft px-1.5 py-0.5 align-middle font-mono text-[9.5px] uppercase tracking-wider text-warning">
      To do
    </span>
  );
}

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-2 mt-8 border-b border-paper-line pb-1.5 text-[17px] font-semibold text-paper-foreground">
    {children}
  </h2>
);

function Label({
  children,
  ai,
  empty,
}: {
  children: React.ReactNode;
  ai?: boolean;
  empty?: boolean;
}) {
  return (
    <div className="mb-0.5 mt-4 px-1.5 text-[13px] font-semibold text-paper-foreground">
      {children}
      {ai && <Chip kind="ai" />}
      {empty && <Chip kind="todo" />}
    </div>
  );
}

function Field({
  value,
  onChange,
  readOnly,
  list,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  list?: string;
}) {
  if (readOnly)
    return (
      <div className="min-h-8 whitespace-pre-wrap px-1.5 py-1 text-[14px] leading-relaxed">
        {value || <span className="text-paper-muted">—</span>}
      </div>
    );
  if (list)
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="paper-field"
        list={list}
      />
    );
  return (
    <textarea
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="paper-field"
      placeholder="Write here…"
    />
  );
}

export function RcaEditorView({ number }: { number: string }) {
  const { data: opts } = useFilterOptions();
  const {
    incident,
    codes,
    form,
    setForm,
    edit,
    addImages,
    draft,
    save,
    publish,
    openDoc,
    download,
  } = useRcaDoc(number);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (incident.error)
    return (
      <p className="rounded-lg bg-destructive-soft px-4 py-3 text-sm text-destructive">
        {(incident.error as Error).message}
      </p>
    );
  if (!form || !incident.data)
    return (
      <div className="panel flex flex-col items-center gap-3 px-5 py-20 text-center">
        <Loader2 className="size-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Drafting from ServiceNow…</p>
      </div>
    );

  const inc = incident.data;
  const ai = (k: string) => form.aiFilled.includes(k);
  const text = (k: TextField) => ({
    value: form[k],
    onChange: (v: string) => edit(k, { [k]: v }),
    readOnly: preview,
  });
  const setAction = (i: number, p: Partial<ActionRow>) =>
    edit("actions", { actions: form.actions.map((a, j) => (j === i ? { ...a, ...p } : a)) });
  const setTime = (i: number, p: Partial<{ time: string; event: string }>) =>
    edit("timeline", { timeline: form.timeline.map((t, j) => (j === i ? { ...t, ...p } : t)) });
  const busy = save.isPending || publish.isPending || draft.isPending;
  const published = inc.rcaStatus === "published";
  const left = todo(form);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <div className="sticky top-0 z-10 -mx-2 mb-5 flex flex-wrap items-center gap-2 rounded-xl border bg-background/90 px-3 py-2.5 backdrop-blur">
          <Link href="/rca/create" className="btn-ghost" aria-label="Back">
            <ArrowLeft className="size-3.5" />
          </Link>
          <span className="font-mono text-sm font-medium">{number}</span>
          {published && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
              <CheckCircle2 className="size-3" />
              In Box
            </span>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border bg-surface p-0.5" role="group" aria-label="Mode">
              <button
                onClick={() => setPreview(false)}
                aria-pressed={!preview}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs",
                  !preview ? "bg-primary-soft text-primary" : "text-muted-foreground",
                )}
              >
                <Pencil className="size-3" />
                Edit
              </button>
              <button
                onClick={() => setPreview(true)}
                aria-pressed={preview}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs",
                  preview ? "bg-primary-soft text-primary" : "text-muted-foreground",
                )}
              >
                <Eye className="size-3" />
                Preview
              </button>
            </div>
            <button
              onClick={() => save.mutate()}
              disabled={busy}
              className="btn-ghost disabled:opacity-50"
            >
              {save.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save
            </button>
            <button
              onClick={() => openDoc.mutate("edit")}
              disabled={busy || openDoc.isPending}
              className="btn-ghost disabled:opacity-50"
            >
              <FileEdit className="size-3.5" />
              Word view
            </button>
            <button onClick={download} disabled={busy} className="btn-ghost disabled:opacity-50">
              <Download className="size-3.5" />
              .docx
            </button>
            {preview ? (
              <button
                onClick={() => publish.mutate()}
                disabled={busy}
                className="btn-primary h-8 disabled:opacity-50"
              >
                {publish.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UploadCloud className="size-4" />
                )}
                Upload to Box
              </button>
            ) : (
              <button onClick={() => setPreview(true)} className="btn-primary h-8">
                <Eye className="size-4" />
                Review
              </button>
            )}
          </div>
        </div>

        {form.documentHtml && (
          <div className="mx-auto mb-4 flex max-w-[820px] items-center gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-2.5 text-[13px] text-warning">
            <FileEdit className="size-4 shrink-0" />
            <span className="flex-1">
              Edited in Word view. Download and upload use that version.
            </span>
            <button
              onClick={() => {
                if (confirm("Discard the Word view edits?")) {
                  setForm((f) => (f ? { ...f, documentHtml: undefined } : f));
                  save.mutate();
                }
              }}
              className="underline underline-offset-4"
            >
              Use form
            </button>
          </div>
        )}

        <article
          className="mx-auto max-w-[820px] rounded-md bg-paper px-14 py-12 text-paper-foreground shadow-2xl"
          aria-label="RCA report"
        >
          <h1 className="px-1.5 text-[26px] font-bold tracking-tight">
            Root Cause Analysis (RCA) Report
          </h1>

          <Label>Problem Number:</Label>
          <div className="px-1.5 font-mono text-[14px]">{form.problemNumber}</div>
          <Label ai={ai("problemTitle")}>Problem Statement</Label>
          <Field {...text("problemTitle")} />

          <Heading>Problem Statement</Heading>
          <Label ai={ai("problemStatement")}>Problem Statement:</Label>
          <Field {...text("problemStatement")} />
          <Label ai={ai("businessImpact")}>Business Impact:</Label>
          <Field {...text("businessImpact")} />

          <Heading>Investigation</Heading>
          <Label ai={ai("timeline")}>Timeline:</Label>
          <table className="mt-1 w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-paper-hover text-left">
                <th className="w-40 border border-paper-line px-2 py-1 font-semibold">Time</th>
                <th className="border border-paper-line px-2 py-1 font-semibold">Event</th>
                {!preview && <th className="w-8 border border-paper-line" />}
              </tr>
            </thead>
            <tbody>
              {form.timeline.map((t, i) => (
                <tr key={i}>
                  <td className="border border-paper-line align-top">
                    <Field
                      value={t.time}
                      onChange={(v) => setTime(i, { time: v })}
                      readOnly={preview}
                    />
                  </td>
                  <td className="border border-paper-line align-top">
                    <Field
                      value={t.event}
                      onChange={(v) => setTime(i, { event: v })}
                      readOnly={preview}
                    />
                  </td>
                  {!preview && (
                    <td className="border border-paper-line text-center align-top">
                      <button
                        aria-label="Remove row"
                        onClick={() =>
                          edit("timeline", { timeline: form.timeline.filter((_, j) => j !== i) })
                        }
                        className="p-1.5 text-paper-muted hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!preview && (
            <button
              onClick={() =>
                edit("timeline", { timeline: [...form.timeline, { time: "", event: "" }] })
              }
              className="mt-1.5 inline-flex items-center gap-1 px-1.5 text-xs text-paper-muted hover:text-primary"
            >
              <Plus className="size-3" />
              Row
            </button>
          )}

          <Label ai={ai("investigation")}>Investigation:</Label>
          <Field {...text("investigation")} />
          <div className="mt-2 flex flex-wrap gap-3 px-1.5">
            {form.images.map((im) => (
              <figure key={im.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={im.dataUrl}
                  alt={im.name}
                  className="max-h-48 rounded border border-paper-line"
                />
                {!preview && (
                  <button
                    aria-label={`Remove ${im.name}`}
                    onClick={() =>
                      setForm((f) =>
                        f ? { ...f, images: f.images.filter((x) => x.id !== im.id) } : f,
                      )
                    }
                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/70 text-white"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </figure>
            ))}
          </div>
          {!preview && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1.5 px-1.5 text-xs text-paper-muted hover:text-primary"
              >
                <ImagePlus className="size-3.5" />
                Add screenshots
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files) void addImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </>
          )}
          <Label ai={ai("serviceRestoration")}>Service Restoration:</Label>
          <Field {...text("serviceRestoration")} />
          <Label empty={!form.nextSteps.trim()}>Next Steps:</Label>
          <Field {...text("nextSteps")} />

          <Heading>Root Cause</Heading>
          <Label ai={ai("rootCauseCode")}>Root Cause Code:</Label>
          {preview ? (
            <div className="px-1.5 text-[14px]">{form.rootCauseCode}</div>
          ) : (
            <select
              value={form.rootCauseCode}
              onChange={(e) => edit("rootCauseCode", { rootCauseCode: e.target.value })}
              className="paper-field w-auto min-w-56"
              aria-label="Root cause code"
            >
              {(codes.data ?? [form.rootCauseCode]).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
          <Label empty={form.whys.every((w) => !w.trim())}>5 Whys:</Label>
          <ol className="space-y-0.5">
            {form.whys.map((w, i) => (
              <li key={i} className="flex gap-1">
                <span className="w-5 shrink-0 pt-1 text-right text-[14px] text-paper-muted">
                  {i + 1}.
                </span>
                <Field
                  value={w}
                  onChange={(v) =>
                    edit("whys", { whys: form.whys.map((x, j) => (j === i ? v : x)) })
                  }
                  readOnly={preview}
                />
              </li>
            ))}
          </ol>
          <Label empty={!form.rootCauseDetails.trim()}>Root Cause Details:</Label>
          <Field {...text("rootCauseDetails")} />

          <Heading>Mitigation{!form.mitigation.trim() && <Chip kind="todo" />}</Heading>
          <Field {...text("mitigation")} />

          <Heading>Corrective Actions</Heading>
          <table className="mt-2 w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-paper-hover text-left">
                {["Number", "Action", "Owner", "Due Date", "State"].map((h) => (
                  <th key={h} className="border border-paper-line px-2 py-1 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.actions.map((a, i) => (
                <tr key={i}>
                  <td className="w-16 border border-paper-line px-2 py-1 align-top text-paper-muted">
                    {i + 1}
                  </td>
                  <td className="border border-paper-line align-top">
                    <Field
                      value={a.action}
                      onChange={(v) => setAction(i, { action: v })}
                      readOnly={preview}
                    />
                  </td>
                  <td className="w-32 border border-paper-line align-top">
                    <Field
                      value={a.owner}
                      onChange={(v) => setAction(i, { owner: v })}
                      readOnly={preview}
                      list="owners"
                    />
                  </td>
                  <td className="w-36 border border-paper-line align-top">
                    {preview ? (
                      <div className="px-1.5 py-1">{a.due}</div>
                    ) : (
                      <input
                        type="date"
                        value={a.due}
                        onChange={(e) => setAction(i, { due: e.target.value })}
                        className="paper-field"
                        aria-label={`Due date ${i + 1}`}
                      />
                    )}
                  </td>
                  <td className="w-28 border border-paper-line align-top">
                    {preview ? (
                      <div className="px-1.5 py-1">{a.state}</div>
                    ) : (
                      <select
                        value={a.state}
                        onChange={(e) => setAction(i, { state: e.target.value })}
                        className="paper-field"
                        aria-label={`State ${i + 1}`}
                      >
                        <option value="" />
                        {STATES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="owners">
            {opts?.people.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </article>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4">
        <IncidentPanel inc={inc} />
        {left.length > 0 && !preview && (
          <div className="panel p-4">
            <div className="eyebrow mb-2">To do · {left.length}</div>
            <ul className="space-y-1 text-[13px] text-muted-foreground">
              {left.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function IncidentPanel({ inc }: { inc: SnowIncidentDetail }) {
  return (
    <div className="panel space-y-4 p-4" aria-label="ServiceNow record">
      <div className="eyebrow">ServiceNow</div>
      <dl className="grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <dt className="eyebrow">Priority</dt>
          <dd className="mt-1 font-mono">{inc.priority}</dd>
        </div>
        <div>
          <dt className="eyebrow">Time</dt>
          <dd className="mt-1 inline-flex items-center gap-1 font-mono">
            <Clock className="size-3 text-primary" />
            {inc.hoursToResolve}h
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Opened</dt>
          <dd className="mt-1">{fmt(inc.opened)}</dd>
        </div>
        <div>
          <dt className="eyebrow">Resolved</dt>
          <dd className="mt-1">{fmt(inc.resolved)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="eyebrow">Assignee</dt>
          <dd className="mt-1">{inc.resolvedBy}</dd>
        </div>
      </dl>
      <ol className="space-y-3 border-l pl-3">
        {inc.workNotes.map((n, i) => (
          <li key={i} className="text-[12.5px] leading-snug">
            <div className="font-mono text-[10.5px] text-muted-foreground">
              {fmt(n.at)} · {n.by}
            </div>
            <div className="mt-0.5">{n.text}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
