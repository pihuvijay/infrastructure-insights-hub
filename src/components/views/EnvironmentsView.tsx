"use client";

import { CheckCircle2, Download, Loader2, Send, Server } from "lucide-react";
import { PageHeader, StatusDot } from "@/components/PageHeader";
import { useEnvActions, useEnvs } from "@/lib/queries";
import { fmtDate, timeAgo } from "@/lib/utils";

export function EnvironmentsView() {
  const { data: envs, isLoading, error } = useEnvs();
  const { notify, applyLatest } = useEnvActions();
  const busy = (m: typeof notify, id: string) => m.isPending && m.variables === id;

  return (
    <>
      <PageHeader title="Environment Tracker" />

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {["Environment", "Applied snapshot", "Applied by", "When", "Status", ""].map((h) => (
                <th key={h} className="eyebrow px-5 py-3 text-left font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  Loading environments…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-destructive">
                  {(error as Error).message}
                </td>
              </tr>
            )}
            {envs?.map((e) => {
              const outdated = e.snapshot !== e.latestAvailable;
              return (
                <tr key={e.id} className="border-b last:border-0 hover:bg-surface/40">
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2.5 font-mono font-medium">
                      <Server className="size-4 text-primary" />
                      {e.id}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-mono text-[13px]">{e.snapshot}</div>
                    {outdated && (
                      <div className="mt-0.5 font-mono text-[11px] text-warning">
                        newer: {e.latestAvailable}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{e.by}</td>
                  <td className="px-5 py-4">
                    <div>{fmtDate(e.when)}</div>
                    <div className="text-xs text-muted-foreground">{timeAgo(e.when)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusDot status={e.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {outdated && (
                        <button
                          onClick={() => applyLatest.mutate(e.id)}
                          disabled={busy(applyLatest, e.id)}
                          className="btn-primary h-8 px-3 text-[13px] disabled:opacity-60"
                        >
                          {busy(applyLatest, e.id) ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Download className="size-3.5" />
                          )}
                          Log latest
                        </button>
                      )}
                      {e.notified ? (
                        <span className="btn-done">
                          <CheckCircle2 className="size-3.5" />
                          Notified
                        </span>
                      ) : (
                        <button
                          onClick={() => notify.mutate(e.id)}
                          disabled={busy(notify, e.id)}
                          className="btn-ghost disabled:opacity-60"
                        >
                          <Send className="size-3.5" />
                          Notify manager
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
