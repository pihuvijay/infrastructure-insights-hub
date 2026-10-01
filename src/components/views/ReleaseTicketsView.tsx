"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useReleaseEnvs } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { TicketState } from "@/lib/types";

const stateCls: Record<TicketState, string> = {
  done: "text-primary",
  in_progress: "text-warning",
  todo: "text-muted-foreground",
};
const stateLabel: Record<TicketState, string> = {
  done: "Done",
  in_progress: "In progress",
  todo: "To do",
};

export function ReleaseTicketsView({ env }: { env: string }) {
  const { data, isLoading, error } = useReleaseEnvs();
  const tickets = data?.find((e) => e.id === env)?.tickets;
  const done = tickets?.filter((t) => t.state === "done").length ?? 0;

  return (
    <>
      <PageHeader
        title={`${env} tickets`}
        action={
          <Link href="/build-release" className="btn-ghost">
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        }
      />
      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {["Ticket", "Title", "Assignee", "Priority", "State"].map((h) => (
                <th key={h} className="eyebrow px-5 py-3 text-left font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                  Loading tickets…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-destructive">
                  {(error as Error).message}
                </td>
              </tr>
            )}
            {data && !tickets?.length && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                  No tickets for {env}
                </td>
              </tr>
            )}
            {tickets?.map((t) => (
              <tr key={t.id} className="border-b last:border-0 hover:bg-surface/40">
                <td className="px-5 py-4 font-mono text-[13px]">{t.id}</td>
                <td className="px-5 py-4">{t.title}</td>
                <td className="px-5 py-4 text-muted-foreground">{t.assignee}</td>
                <td className="px-5 py-4 font-mono text-[13px]">{t.priority}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider",
                      stateCls[t.state],
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {stateLabel[t.state]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tickets && (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          {done}/{tickets.length} done
        </p>
      )}
    </>
  );
}
