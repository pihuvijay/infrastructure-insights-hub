"use client";

import { useRef } from "react";
import { Eye, FileEdit, ImagePlus, Loader2, Plus, Save, UploadCloud, X } from "lucide-react";
import { useFilterOptions } from "@/lib/queries";
import { STATES, todo, useRcaDoc } from "@/lib/use-rca-doc";
import type { ActionRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const fmt = (iso: string) => iso.replace("T", " ").slice(0, 16);

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-b px-5 py-5">
      <div className="flex items-center gap-2">
        <h3 className="eyebrow">{title}</h3>
        {count ? (
          <span className="rounded bg-warning-soft px-1.5 font-mono text-[10px] text-warning">
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function F({
  label,
  todo: needs,
  children,
}: {
  label: string;
  todo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-2 text-xs font-medium text-secondary-foreground">
        {label}
        {needs && <span className="size-1.5 rounded-full bg-warning" aria-label="To do" />}
      </span>
      {children}
    </label>
  );
}

export function RcaSidePanel({ number, onClose }: { number: string; onClose: () => void }) {
  const { data: opts } = useFilterOptions();
  const { incident, codes, form, setForm, edit, addImages, save, publish, draft, openDoc } =
    useRcaDoc(number);
  const fileRef = useRef<HTMLInputElement>(null);
  const inc = incident.data;
  const left = form ? todo(form) : [];
  const busy = save.isPending || publish.isPending || draft.isPending;

  const setAction = (i: number, p: Partial<ActionRow>) =>
    form &&
    edit("actions", { actions: form.actions.map((a, j) => (j === i ? { ...a, ...p } : a)) });
  const setTime = (i: number, p: Partial<{ time: string; event: string }>) =>
    form &&
    edit("timeline", { timeline: form.timeline.map((t, j) => (j === i ? { ...t, ...p } : t)) });

  return (
    <aside
      className="fixed right-0 top-0 z-30 flex h-screen w-1/2 min-w-[520px] flex-col border-l bg-sidebar shadow-2xl animate-in slide-in-from-right-8 fade-in"
      aria-label={`RCA ${number}`}
    >
      <header className="flex items-start gap-3 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            Edit RCA info · {number}
            {inc && <span className="text-foreground">{inc.priority}</span>}
            {left.length > 0 && (
              <span className="rounded bg-warning-soft px-1.5 text-warning">
                {left.length} to do
              </span>
            )}
          </div>
          <h2 className="mt-1 truncate text-[15px] font-semibold">
            {inc?.shortDescription ?? "Loading…"}
          </h2>
          {inc && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {inc.resolvedBy} · {fmt(inc.opened)} → {fmt(inc.resolved)} · {inc.hoursToResolve}h
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </header>

      {!form || !inc ? (
        <div className="grid flex-1 place-items-center">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <Group title="From ServiceNow">
            <F label="Problem statement">
              <textarea
                className="textarea"
                value={form.problemStatement}
                onChange={(e) => edit("problemStatement", { problemStatement: e.target.value })}
              />
            </F>
            <F label="Business impact">
              <textarea
                className="textarea"
                value={form.businessImpact}
                onChange={(e) => edit("businessImpact", { businessImpact: e.target.value })}
              />
            </F>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-secondary-foreground">Timeline</span>
              {form.timeline.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input h-9 w-36 shrink-0 font-mono text-xs"
                    value={t.time}
                    onChange={(e) => setTime(i, { time: e.target.value })}
                    aria-label={`Time ${i + 1}`}
                  />
                  <textarea
                    className="textarea"
                    value={t.event}
                    onChange={(e) => setTime(i, { event: e.target.value })}
                    aria-label={`Event ${i + 1}`}
                  />
                </div>
              ))}
            </div>
            <F label="Service restoration">
              <textarea
                className="textarea"
                value={form.serviceRestoration}
                onChange={(e) => edit("serviceRestoration", { serviceRestoration: e.target.value })}
              />
            </F>
            <F label="Root cause code">
              <select
                className="input h-9"
                value={form.rootCauseCode}
                onChange={(e) => edit("rootCauseCode", { rootCauseCode: e.target.value })}
              >
                {(codes.data ?? [form.rootCauseCode]).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </F>
          </Group>

          <Group title="To complete" count={left.length}>
            <F label="Investigation">
              <textarea
                className="textarea"
                value={form.investigation}
                onChange={(e) => edit("investigation", { investigation: e.target.value })}
              />
            </F>
            <div className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-medium text-secondary-foreground">
                Screenshots
                {form.images.length === 0 && <span className="size-1.5 rounded-full bg-warning" />}
              </span>
              <div className="flex flex-wrap gap-2">
                {form.images.map((im) => (
                  <div key={im.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={im.dataUrl}
                      alt={im.name}
                      className="size-20 rounded-lg border object-cover"
                    />
                    <button
                      aria-label={`Remove ${im.name}`}
                      onClick={() =>
                        setForm((f) =>
                          f ? { ...f, images: f.images.filter((x) => x.id !== im.id) } : f,
                        )
                      }
                      className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-background border"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void addImages(e.dataTransfer.files);
                  }}
                  className="grid size-20 place-items-center rounded-lg border border-dashed text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                  aria-label="Add screenshots"
                >
                  <ImagePlus className="size-5" />
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
              </div>
            </div>
            <F label="5 Whys" todo={form.whys.every((w) => !w.trim())}>
              <div className="space-y-1.5">
                {form.whys.map((w, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-4 pt-2 text-right font-mono text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <textarea
                      className="textarea"
                      value={w}
                      onChange={(e) =>
                        edit("whys", {
                          whys: form.whys.map((x, j) => (j === i ? e.target.value : x)),
                        })
                      }
                      aria-label={`Why ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </F>
            <F label="Root cause details" todo={!form.rootCauseDetails.trim()}>
              <textarea
                className="textarea"
                value={form.rootCauseDetails}
                onChange={(e) => edit("rootCauseDetails", { rootCauseDetails: e.target.value })}
              />
            </F>
            <F label="Mitigation" todo={!form.mitigation.trim()}>
              <textarea
                className="textarea"
                value={form.mitigation}
                onChange={(e) => edit("mitigation", { mitigation: e.target.value })}
              />
            </F>
            <F label="Next steps" todo={!form.nextSteps.trim()}>
              <textarea
                className="textarea"
                value={form.nextSteps}
                onChange={(e) => edit("nextSteps", { nextSteps: e.target.value })}
              />
            </F>
          </Group>

          <Group title="Corrective actions">
            {form.actions.map((a, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px] gap-2 rounded-lg border p-2.5">
                <textarea
                  className="textarea col-span-2"
                  placeholder={`Action ${i + 1}`}
                  value={a.action}
                  onChange={(e) => setAction(i, { action: e.target.value })}
                  aria-label={`Action ${i + 1}`}
                />
                <input
                  className="input h-9 text-xs"
                  list="panel-owners"
                  placeholder="Owner"
                  value={a.owner}
                  onChange={(e) => setAction(i, { owner: e.target.value })}
                  aria-label={`Owner ${i + 1}`}
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="input h-9 text-xs"
                    value={a.due}
                    onChange={(e) => setAction(i, { due: e.target.value })}
                    aria-label={`Due ${i + 1}`}
                  />
                </div>
                <select
                  className={cn("input h-9 text-xs", !a.state && "text-muted-foreground")}
                  value={a.state}
                  onChange={(e) => setAction(i, { state: e.target.value })}
                  aria-label={`State ${i + 1}`}
                >
                  <option value="">State</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
            <button
              onClick={() =>
                edit("actions", {
                  actions: [...form.actions, { action: "", owner: "", due: "", state: "" }],
                })
              }
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <Plus className="size-3" />
              Add action
            </button>
            <datalist id="panel-owners">
              {opts?.people.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Group>
        </div>
      )}

      <footer className="flex items-center gap-2 border-t px-5 py-3">
        <button
          onClick={() => save.mutate()}
          disabled={!form || busy}
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
          onClick={() => openDoc.mutate("view")}
          disabled={!form || busy}
          className="btn-ghost disabled:opacity-50"
        >
          <Eye className="size-3.5" />
          View Word
        </button>
        <button
          onClick={() => openDoc.mutate("edit")}
          disabled={!form || busy}
          className="btn-ghost disabled:opacity-50"
        >
          <FileEdit className="size-3.5" />
          Edit Word
        </button>
        <button
          onClick={() => publish.mutate()}
          disabled={!form || busy}
          className="btn-primary ml-auto h-8 disabled:opacity-50"
        >
          {publish.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UploadCloud className="size-4" />
          )}
          Upload to Box
        </button>
      </footer>
    </aside>
  );
}
