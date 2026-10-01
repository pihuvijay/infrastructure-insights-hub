import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex items-end justify-between gap-6">
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-[15px] text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatusDot({ status }: { status: "synced" | "stale" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider",
        status === "synced" ? "text-primary" : "text-warning",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
