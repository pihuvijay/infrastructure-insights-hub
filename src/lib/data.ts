export type EnvStatus = "synced" | "stale";
export interface Env { id: string; snapshot: string; by: string; when: string; status: EnvStatus; notified: boolean }

export const ENVIRONMENTS: Env[] = [
  { id: "STG-US", snapshot: "snap-2026-09-30-b2", by: "M. Okafor", when: "2026-09-30T10:05:00", status: "synced", notified: false },
  { id: "UAT-EU", snapshot: "snap-2026-09-29-c3", by: "L. Mendes", when: "2026-09-29T12:15:00", status: "synced", notified: true },
  { id: "PROD-01", snapshot: "snap-2026-09-28-r4", by: "A. Khoury", when: "2026-09-28T15:22:00", status: "synced", notified: true },
  { id: "DEV-02", snapshot: "snap-2026-09-15-a1", by: "R. Singh", when: "2026-09-15T19:40:00", status: "stale", notified: false },
];

export interface Tool { name: string; desc: string; url: string }
export interface Folder { name: string; tools: Tool[] }

export const FOLDERS: Folder[] = [
  { name: "Admin", tools: [
    { name: "Annual leave system", desc: "Request & track annual leave", url: "#" },
    { name: "ServiceNow sign-up", desc: "Request a ServiceNow account", url: "#" },
    { name: "HR portal", desc: "Personal & payroll details", url: "#" },
    { name: "Expenses system", desc: "Submit & approve expenses", url: "#" },
    { name: "IT helpdesk", desc: "Raise IT support tickets", url: "#" },
  ]},
  { name: "Training", tools: [
    { name: "Learning portal", desc: "Mandatory compliance modules", url: "#" },
    { name: "Security awareness", desc: "Annual security training", url: "#" },
    { name: "Runbook library", desc: "Standard operating procedures", url: "#" },
    { name: "Shadowing rota", desc: "Book on-call shadow shifts", url: "#" },
  ]},
  { name: "Working", tools: [
    { name: "Jira", desc: "Sprint boards & backlog", url: "#" },
    { name: "Slack", desc: "Team channels", url: "#" },
    { name: "Confluence", desc: "Team wiki", url: "#" },
    { name: "Box", desc: "Shared documents & files", url: "#" },
    { name: "PagerDuty", desc: "On-call schedules", url: "#" },
  ]},
  { name: "Location", tools: [
    { name: "Desk booking", desc: "Reserve a desk on site", url: "#" },
    { name: "Site access", desc: "Data centre access requests", url: "#" },
    { name: "Travel booking", desc: "Book trips to sites", url: "#" },
    { name: "Floor plans", desc: "Office & DC layouts", url: "#" },
  ]},
  { name: "Tools", tools: [
    { name: "Datadog", desc: "Metrics & dashboards", url: "#" },
    { name: "ServiceNow", desc: "Incidents & changes", url: "#" },
    { name: "Grafana", desc: "Infrastructure graphs", url: "#" },
    { name: "Splunk", desc: "Log search", url: "#" },
    { name: "Vault", desc: "Secrets management", url: "#" },
    { name: "Terraform Cloud", desc: "Infrastructure runs", url: "#" },
  ]},
];

export interface Incident { id: string; title: string; source: "ServiceNow" | "Box"; rootCause: string; resolution: string; hours: number; date: string; cluster: string; owner: string }

export const INCIDENTS: Incident[] = [
  { id: "INC0041822", title: "Database connection pool exhausted on PROD-01", source: "ServiceNow", rootCause: "Connection leak after driver upgrade", resolution: "Rolled back JDBC driver, set pool max-lifetime", hours: 6, date: "2026-09-21", cluster: "pool", owner: "A. Khoury" },
  { id: "INC0041530", title: "API latency spike, 5xx on gateway", source: "ServiceNow", rootCause: "DB pool saturation under batch load", resolution: "Increased pool size, throttled batch job", hours: 4.5, date: "2026-09-12", cluster: "pool", owner: "R. Singh" },
  { id: "BOX-RCA-118", title: "Post-mortem: payments outage 2026-08", source: "Box", rootCause: "Connection leak in retry handler", resolution: "Patched retry handler to close sessions", hours: 11, date: "2026-08-30", cluster: "pool", owner: "L. Mendes" },
  { id: "INC0040987", title: "TLS handshake failures on UAT-EU", source: "ServiceNow", rootCause: "Expired intermediate certificate", resolution: "Rotated cert chain", hours: 3, date: "2026-09-02", cluster: "cert", owner: "M. Okafor" },
  { id: "INC0041701", title: "Monitoring agent cannot reach collector", source: "ServiceNow", rootCause: "Certificate expired on collector", resolution: "Renewed collector cert, added alert", hours: 2.5, date: "2026-09-18", cluster: "cert", owner: "A. Khoury" },
  { id: "BOX-RCA-121", title: "Snapshot restore failed on DEV-02", source: "Box", rootCause: "Disk quota reached during restore", resolution: "Pruned old snapshots, raised quota", hours: 5, date: "2026-09-16", cluster: "disk", owner: "R. Singh" },
  { id: "INC0041904", title: "Log volume full on STG-US", source: "ServiceNow", rootCause: "Log rotation disabled after config drift", resolution: "Re-enabled logrotate via config mgmt", hours: 3.5, date: "2026-09-25", cluster: "disk", owner: "M. Okafor" },
];

export interface Cluster { id: string; name: string; severity: "critical" | "high" | "medium"; summary: string; fix: string; incidents: number; hoursSpent: number; hoursSavable: number; trend: number[] }

export const CLUSTERS: Cluster[] = [
  { id: "pool", name: "DB connection pool exhaustion", severity: "critical", summary: "Connection leaks after library upgrades and in retry paths repeatedly saturate pools on PROD and UAT.", fix: "Add pool-leak detection and a pre-upgrade checklist for DB drivers.", incidents: 9, hoursSpent: 52, hoursSavable: 38, trend: [1, 0, 2, 1, 2, 3] },
  { id: "cert", name: "Certificate expiry", severity: "high", summary: "Intermediate and collector certificates expire without alerting, causing TLS and telemetry failures.", fix: "Central cert inventory with 30-day expiry alerts.", incidents: 6, hoursSpent: 21, hoursSavable: 17, trend: [0, 1, 1, 0, 2, 2] },
  { id: "disk", name: "Disk / log volume saturation", severity: "medium", summary: "Config drift disables log rotation and snapshot pruning, filling volumes.", fix: "Enforce logrotate & snapshot retention in config management.", incidents: 5, hoursSpent: 18, hoursSavable: 12, trend: [1, 1, 0, 1, 1, 1] },
];

export const timeAgo = (iso: string) => {
  const d = Math.round((Date.parse("2026-10-01T10:30:00") - Date.parse(iso)) / 86400000);
  return d <= 0 ? "today" : `${d}d ago`;
};
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
