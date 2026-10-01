import { FileText, Ticket, UserCheck } from "lucide-react";
import type { IncidentStatus, ScoredIncident } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusCls: Record<IncidentStatus, string> = {
  resolved: "bg-primary-soft text-primary",
  workaround: "bg-warning-soft text-warning",
  open: "bg-destructive-soft text-destructive",
};

export function IncidentCard({
  i,
  showScore,
  compact,
}: {
  i: ScoredIncident;
  showScore: boolean;
  compact?: boolean;
}) {
  const Icon = i.source === "ServiceNow" ? Ticket : FileText;
  return (
    <article className={cn("panel transition hover:border-primary/30", compact ? "p-4" : "p-5")}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                statusCls[i.status],
              )}
            >
              {i.status}
            </span>
            {showScore && (
              <span className="ml-auto font-mono text-xs text-primary">
                {Math.round(i.score * 100)}%
              </span>
            )}
          </div>
          <h3 className="mt-1 text-sm font-medium leading-snug">{i.title}</h3>
          <dl className={cn("mt-3 grid gap-3 text-[13px]", !compact && "sm:grid-cols-2")}>
            <div>
              <dt className="eyebrow">Root cause</dt>
              <dd className="mt-1">{i.rootCause}</dd>
            </div>
            <div>
              <dt className="eyebrow">Resolution</dt>
              <dd className="mt-1">{i.resolution}</dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-foreground">
              <UserCheck className="size-3.5 text-primary" />
              {i.resolvedBy}
            </span>
            <span>{i.project}</span>
            <span>{i.date}</span>
            <span>{i.hours}h</span>
          </div>
        </div>
      </div>
    </article>
  );
}
