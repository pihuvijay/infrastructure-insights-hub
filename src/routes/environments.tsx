import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Send, CheckCircle2, Server, X } from "lucide-react";
import { PageHeader, StatusDot } from "@/components/AppSidebar";
import { useEnvs, notifyManager, logSnapshot } from "@/lib/env-store";
import { fmtDate, timeAgo } from "@/lib/data";

export const Route = createFileRoute("/environments")({
  head: () => ({
    meta: [
      { title: "Environment Tracker — InfraCore" },
      { name: "description", content: "See which snapshot was last applied to each environment and notify your line manager." },
      { property: "og:title", content: "Environment Tracker — InfraCore" },
      { property: "og:description", content: "Track snapshots per environment." },
    ],
  }),
  component: Environments,
});

function Environments() {
  const envs = useEnvs();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: envs[0].id, snapshot: "", by: "pihuvijay" });

  return (
    <>
      <PageHeader
        title="Environment Tracker"
        sub="Which snapshot is on each environment — and who knows about it."
        action={<button onClick={() => setOpen(true)} className="btn-primary"><Plus className="size-4" />Log snapshot</button>}
      />

      {open && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.snapshot) return; logSnapshot(form.id, form.snapshot, form.by); setOpen(false); setForm({ ...form, snapshot: "" }); }}
          className="panel mb-5 flex flex-wrap items-end gap-3 p-4 animate-in fade-in slide-in-from-top-1"
        >
          <label className="space-y-1.5"><span className="eyebrow">Environment</span>
            <select className="input w-40" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })}>
              {envs.map((e) => <option key={e.id}>{e.id}</option>)}
            </select>
          </label>
          <label className="flex-1 space-y-1.5"><span className="eyebrow">Snapshot</span>
            <input autoFocus className="input font-mono" placeholder="snap-2026-10-01-a1" value={form.snapshot} onChange={(e) => setForm({ ...form, snapshot: e.target.value })} />
          </label>
          <button className="btn-primary h-10">Save</button>
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost h-10" aria-label="Cancel"><X className="size-4" /></button>
        </form>
      )}

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {["Environment", "Last snapshot", "Applied by", "When", "Status", ""].map((h) => (
                <th key={h} className="eyebrow px-5 py-3 text-left font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {envs.map((e) => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-surface/40">
                <td className="px-5 py-4"><span className="flex items-center gap-2.5 font-mono font-medium"><Server className="size-4 text-primary" />{e.id}</span></td>
                <td className="px-5 py-4 font-mono text-[13px]">{e.snapshot}</td>
                <td className="px-5 py-4 text-muted-foreground">{e.by}</td>
                <td className="px-5 py-4"><div>{fmtDate(e.when)}</div><div className="text-xs text-muted-foreground">{timeAgo(e.when)}</div></td>
                <td className="px-5 py-4"><StatusDot status={e.status} /></td>
                <td className="px-5 py-4 text-right">
                  {e.notified
                    ? <span className="btn-done"><CheckCircle2 className="size-3.5" />Notified</span>
                    : <button onClick={() => notifyManager(e.id)} className="btn-ghost"><Send className="size-3.5" />Notify manager</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
