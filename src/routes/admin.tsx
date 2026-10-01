import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppSidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Settings — InfraCore" },
      { name: "description", content: "Manage notifications, line manager and data sources." },
      { property: "og:title", content: "Admin Settings — InfraCore" },
      { property: "og:description", content: "InfraCore preferences." },
    ],
  }),
  component: Admin,
});

function Toggle({ label, desc, def }: { label: string; desc: string; def?: boolean }) {
  const [on, setOn] = useState(!!def);
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div><div className="text-sm font-medium">{label}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
      <button role="switch" aria-checked={on} onClick={() => setOn(!on)} className={cn("relative h-5 w-9 rounded-full transition", on ? "bg-primary" : "bg-muted")}>
        <span className={cn("absolute top-0.5 size-4 rounded-full bg-foreground transition", on ? "left-4.5" : "left-0.5")} />
      </button>
    </div>
  );
}

function Admin() {
  return (
    <>
      <PageHeader title="Admin Settings" sub="Who gets notified, and where incident data comes from." />
      <div className="max-w-2xl space-y-5">
        <section className="panel p-5">
          <div className="eyebrow mb-2">Line manager</div>
          <input className="input" defaultValue="manager@company.com" />
        </section>
        <section className="panel divide-y">
          <Toggle label="Auto-notify on snapshot" desc="Send your manager a message when you log a snapshot" def />
          <Toggle label="Sync ServiceNow" desc="Pull resolved tickets nightly into RCA" />
          <Toggle label="Sync Box folder" desc="Index new post-mortems automatically" />
          <Toggle label="Weekly insights digest" desc="Email the top recurring clusters every Monday" def />
        </section>
      </div>
    </>
  );
}
