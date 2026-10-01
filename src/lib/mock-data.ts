import type {
  Cluster,
  Env,
  Folder,
  Incident,
  Insights,
  Priority,
  ReleaseEnv,
  ReleaseTicket,
  RcaStatus,
  SnowIncidentDetail,
} from "./types";

export const MOCK_NOW = "2026-10-01T10:30:00";

export const ENVIRONMENTS: Env[] = [
  {
    id: "PD2",
    snapshot: "snap-2026-09-30-b2",
    by: "M. Okafor",
    when: "2026-09-30T10:05:00",
    status: "synced",
    notified: false,
    latestAvailable: "snap-2026-10-01-b3",
  },
  {
    id: "MPR1",
    snapshot: "snap-2026-09-29-c3",
    by: "L. Mendes",
    when: "2026-09-29T12:15:00",
    status: "synced",
    notified: true,
    latestAvailable: "snap-2026-09-29-c3",
  },
  {
    id: "PD1",
    snapshot: "snap-2026-09-28-r4",
    by: "A. Khoury",
    when: "2026-09-28T15:22:00",
    status: "synced",
    notified: true,
    latestAvailable: "snap-2026-09-28-r4",
  },
  {
    id: "MPR2",
    snapshot: "snap-2026-09-15-a1",
    by: "R. Singh",
    when: "2026-09-15T19:40:00",
    status: "stale",
    notified: false,
    latestAvailable: "snap-2026-10-01-a2",
  },
];

export const FOLDERS: Folder[] = [
  {
    name: "Admin",
    tools: [
      { name: "Annual leave system", desc: "Request & track annual leave", url: "#" },
      { name: "ServiceNow sign-up", desc: "Request a ServiceNow account", url: "#" },
      { name: "HR portal", desc: "Personal & payroll details", url: "#" },
      { name: "Expenses system", desc: "Submit & approve expenses", url: "#" },
      { name: "IT helpdesk", desc: "Raise IT support tickets", url: "#" },
    ],
  },
  {
    name: "Training",
    tools: [
      { name: "Learning portal", desc: "Mandatory compliance modules", url: "#" },
      { name: "Security awareness", desc: "Annual security training", url: "#" },
      { name: "Runbook library", desc: "Standard operating procedures", url: "#" },
      { name: "Shadowing rota", desc: "Book on-call shadow shifts", url: "#" },
    ],
  },
  {
    name: "Working",
    tools: [
      { name: "Jira", desc: "Sprint boards & backlog", url: "#" },
      { name: "Slack", desc: "Team channels", url: "#" },
      { name: "Confluence", desc: "Team wiki", url: "#" },
      { name: "Box", desc: "Shared documents & files", url: "#" },
      { name: "PagerDuty", desc: "On-call schedules", url: "#" },
    ],
  },
  {
    name: "Location",
    tools: [
      { name: "Desk booking", desc: "Reserve a desk on site", url: "#" },
      { name: "Site access", desc: "Data centre access requests", url: "#" },
      { name: "Travel booking", desc: "Book trips to sites", url: "#" },
      { name: "Floor plans", desc: "Office & DC layouts", url: "#" },
    ],
  },
  {
    name: "Tools",
    tools: [
      { name: "Datadog", desc: "Metrics & dashboards", url: "#" },
      { name: "ServiceNow", desc: "Incidents & changes", url: "#" },
      { name: "Grafana", desc: "Infrastructure graphs", url: "#" },
      { name: "Splunk", desc: "Log search", url: "#" },
      { name: "Vault", desc: "Secrets management", url: "#" },
      { name: "Terraform Cloud", desc: "Infrastructure runs", url: "#" },
    ],
  },
];

export const PROJECTS = [
  "Payments Platform",
  "Grid Telemetry",
  "Customer Portal",
  "Data Warehouse",
];

type I = Omit<Incident, "status" | "severity"> & Partial<Pick<Incident, "status" | "severity">>;
const inc = (i: I): Incident => ({ status: "resolved", severity: "high", ...i });

export const INCIDENTS: Incident[] = [
  inc({
    id: "INC0041822",
    title: "Database connection pool exhausted on PD1",
    source: "ServiceNow",
    project: "Payments Platform",
    severity: "critical",
    rootCause: "Connection leak after driver upgrade",
    resolution: "Rolled back JDBC driver, set pool max-lifetime",
    hours: 6,
    date: "2026-09-21",
    cluster: "pool",
    resolvedBy: "A. Khoury",
  }),
  inc({
    id: "INC0041530",
    title: "API latency spike, 5xx on gateway",
    source: "ServiceNow",
    project: "Customer Portal",
    severity: "high",
    rootCause: "DB pool saturation under batch load",
    resolution: "Increased pool size, throttled batch job",
    hours: 4.5,
    date: "2026-09-12",
    cluster: "pool",
    resolvedBy: "R. Singh",
  }),
  inc({
    id: "BOX-RCA-118",
    title: "Post-mortem: payments outage 2026-08",
    source: "Box",
    project: "Payments Platform",
    severity: "critical",
    rootCause: "Connection leak in retry handler",
    resolution: "Patched retry handler to close sessions",
    hours: 11,
    date: "2026-08-30",
    cluster: "pool",
    resolvedBy: "L. Mendes",
  }),
  inc({
    id: "INC0039877",
    title: "Order service timeouts during month-end batch",
    source: "ServiceNow",
    project: "Payments Platform",
    severity: "high",
    rootCause: "Connection leak in retry handler",
    resolution: "Added session close in finally block",
    hours: 7,
    date: "2026-05-14",
    cluster: "pool",
    resolvedBy: "L. Mendes",
  }),
  inc({
    id: "INC0036210",
    title: "Reporting DB refuses new connections",
    source: "ServiceNow",
    project: "Data Warehouse",
    severity: "high",
    rootCause: "Pool exhausted after library upgrade",
    resolution: "Pinned previous driver version",
    hours: 8,
    date: "2026-01-22",
    cluster: "pool",
    resolvedBy: "R. Singh",
  }),
  inc({
    id: "INC0031044",
    title: "Portal login hangs under load",
    source: "ServiceNow",
    project: "Customer Portal",
    severity: "medium",
    rootCause: "Connection leak after driver upgrade",
    resolution: "Rolled back driver; workaround pending fix",
    hours: 5,
    date: "2025-08-03",
    cluster: "pool",
    resolvedBy: "A. Khoury",
    status: "workaround",
  }),
  inc({
    id: "INC0040987",
    title: "TLS handshake failures on MPR1",
    source: "ServiceNow",
    project: "Customer Portal",
    severity: "high",
    rootCause: "Expired intermediate certificate",
    resolution: "Rotated cert chain",
    hours: 3,
    date: "2026-09-02",
    cluster: "cert",
    resolvedBy: "M. Okafor",
  }),
  inc({
    id: "INC0041701",
    title: "Monitoring agent cannot reach collector",
    source: "ServiceNow",
    project: "Grid Telemetry",
    severity: "high",
    rootCause: "Certificate expired on collector",
    resolution: "Renewed collector cert, added alert",
    hours: 2.5,
    date: "2026-09-18",
    cluster: "cert",
    resolvedBy: "A. Khoury",
  }),
  inc({
    id: "BOX-RCA-097",
    title: "Post-mortem: telemetry blackout across sites",
    source: "Box",
    project: "Grid Telemetry",
    severity: "critical",
    rootCause: "Collector certificate expired unnoticed",
    resolution: "Issued new cert, created expiry calendar",
    hours: 9,
    date: "2026-03-11",
    cluster: "cert",
    resolvedBy: "M. Okafor",
  }),
  inc({
    id: "INC0034002",
    title: "Payments API rejects mTLS clients",
    source: "ServiceNow",
    project: "Payments Platform",
    severity: "high",
    rootCause: "Expired intermediate certificate",
    resolution: "Rotated cert chain on gateway",
    hours: 3.5,
    date: "2025-11-19",
    cluster: "cert",
    resolvedBy: "M. Okafor",
  }),
  inc({
    id: "BOX-RCA-121",
    title: "Snapshot restore failed on MPR2",
    source: "Box",
    project: "Data Warehouse",
    severity: "medium",
    rootCause: "Disk quota reached during restore",
    resolution: "Pruned old snapshots, raised quota",
    hours: 5,
    date: "2026-09-16",
    cluster: "disk",
    resolvedBy: "R. Singh",
  }),
  inc({
    id: "INC0041904",
    title: "Log volume full on PD2",
    source: "ServiceNow",
    project: "Grid Telemetry",
    severity: "medium",
    rootCause: "Log rotation disabled after config drift",
    resolution: "Re-enabled logrotate via config mgmt",
    hours: 3.5,
    date: "2026-09-25",
    cluster: "disk",
    resolvedBy: "M. Okafor",
  }),
  inc({
    id: "INC0038115",
    title: "Portal host out of disk, services halted",
    source: "ServiceNow",
    project: "Customer Portal",
    severity: "high",
    rootCause: "Log rotation disabled after config drift",
    resolution: "Cleared logs, enforced logrotate policy",
    hours: 4,
    date: "2026-04-08",
    cluster: "disk",
    resolvedBy: "R. Singh",
  }),
  inc({
    id: "INC0033310",
    title: "Warehouse snapshot job fills volume",
    source: "ServiceNow",
    project: "Data Warehouse",
    severity: "medium",
    rootCause: "Snapshot retention not enforced",
    resolution: "Added retention to config management",
    hours: 2,
    date: "2025-10-27",
    cluster: "disk",
    resolvedBy: "L. Mendes",
  }),
  inc({
    id: "INC0029551",
    title: "Gateway restart loop after config push",
    source: "ServiceNow",
    project: "Customer Portal",
    severity: "medium",
    rootCause: "Config drift between nodes",
    resolution: "Re-applied baseline config",
    hours: 2,
    date: "2025-06-02",
    cluster: "disk",
    resolvedBy: "R. Singh",
    status: "open",
  }),
];

export const PEOPLE = Array.from(new Set(INCIDENTS.map((i) => i.resolvedBy))).sort();

export const CLUSTERS: Cluster[] = [
  {
    id: "pool",
    name: "DB connection pool exhaustion",
    severity: "critical",
    summary:
      "Connection leaks after library upgrades and in retry paths repeatedly saturate pools on PROD and UAT.",
    fix: "Add pool-leak detection and a pre-upgrade checklist for DB drivers.",
    incidents: 9,
    hoursSpent: 52,
    hoursSavable: 38,
    trend: [1, 0, 2, 1, 2, 3],
  },
  {
    id: "cert",
    name: "Certificate expiry",
    severity: "high",
    summary:
      "Intermediate and collector certificates expire without alerting, causing TLS and telemetry failures.",
    fix: "Central cert inventory with 30-day expiry alerts.",
    incidents: 6,
    hoursSpent: 21,
    hoursSavable: 17,
    trend: [0, 1, 1, 0, 2, 2],
  },
  {
    id: "disk",
    name: "Disk / log volume saturation",
    severity: "medium",
    summary: "Config drift disables log rotation and snapshot pruning, filling volumes.",
    fix: "Enforce logrotate & snapshot retention in config management.",
    incidents: 5,
    hoursSpent: 18,
    hoursSavable: 12,
    trend: [1, 1, 0, 1, 1, 1],
  },
];

export const INSIGHTS: Insights = {
  clusters: CLUSTERS,
  monthly: [
    { month: "Apr", incidents: 14, avgHours: 6.8 },
    { month: "May", incidents: 18, avgHours: 7.4 },
    { month: "Jun", incidents: 12, avgHours: 5.9 },
    { month: "Jul", incidents: 21, avgHours: 8.1 },
    { month: "Aug", incidents: 17, avgHours: 6.2 },
    { month: "Sep", incidents: 23, avgHours: 7.9 },
  ],
  rootCauses: [
    { name: "Connection leaks", value: 31 },
    { name: "Config drift", value: 22 },
    { name: "Cert expiry", value: 19 },
    { name: "Capacity", value: 16 },
    { name: "Other", value: 12 },
  ],
  subsystems: [
    { name: "Database", critical: 6, high: 5, medium: 3 },
    { name: "Network", critical: 2, high: 6, medium: 4 },
    { name: "Storage", critical: 1, high: 3, medium: 7 },
    { name: "Auth / PKI", critical: 3, high: 4, medium: 2 },
    { name: "Monitoring", critical: 0, high: 2, medium: 5 },
  ],
  heatmap: [
    { name: "Database", hours: [9, 12, 6, 14, 8, 15] },
    { name: "Network", hours: [4, 6, 5, 7, 3, 6] },
    { name: "Storage", hours: [3, 5, 2, 6, 7, 5] },
    { name: "Auth / PKI", hours: [6, 2, 8, 3, 9, 7] },
    { name: "Monitoring", hours: [2, 3, 1, 4, 2, 3] },
  ],
  agents: [
    { id: "ingest", name: "Ingest", desc: "Pulls ServiceNow & Box" },
    { id: "embed", name: "Embed", desc: "Chunks & vectorises" },
    { id: "cluster", name: "Cluster", desc: "Groups by root cause" },
    { id: "impact", name: "Impact", desc: "Estimates hours" },
    { id: "advisor", name: "Advisor", desc: "Chats with you" },
  ],
};

export const ROOT_CAUSE_CODES = [
  "Software defect",
  "Configuration error",
  "Capacity",
  "Certificate / PKI",
  "Hardware failure",
  "Change related",
  "Third party",
  "Unknown",
];

const addH = (iso: string, h: number) =>
  new Date(Date.parse(iso) + h * 3_600_000).toISOString().slice(0, 19);
const PRIORITY: Record<string, Priority> = { critical: "P1", high: "P2", medium: "P3" };
const BOX_DONE = new Set(["BOX-RCA-118", "BOX-RCA-121", "BOX-RCA-097"]);
const DRAFTS = new Set(["INC0041822", "INC0041701"]);
const CODE: Record<string, string> = {
  pool: "Software defect",
  cert: "Certificate / PKI",
  disk: "Configuration error",
};

const fromIncident = (i: Incident): SnowIncidentDetail => {
  const opened = `${i.date}T09:00:00`;
  const resolved = addH(opened, i.hours);
  const rcaStatus: RcaStatus = BOX_DONE.has(i.id)
    ? "published"
    : DRAFTS.has(i.id)
      ? "draft"
      : "none";
  return {
    number: i.id.replace("BOX-RCA-", "INC0039"),
    shortDescription: i.title,
    project: i.project,
    priority: PRIORITY[i.severity] ?? "P3",
    opened,
    resolved,
    hoursToResolve: i.hours,
    resolvedBy: i.resolvedBy,
    rcaStatus,
    boxUrl: rcaStatus === "published" ? "#" : null,
    description: `${i.title}. Raised against ${i.project}.`,
    workNotes: [
      {
        at: addH(opened, 0.2),
        by: "Service Desk",
        text: `Incident logged: ${i.title}. Assigned to ${i.resolvedBy}.`,
      },
      {
        at: addH(opened, Math.max(0.5, i.hours * 0.3)),
        by: i.resolvedBy,
        text: `Investigation started. Findings point to: ${i.rootCause.toLowerCase()}.`,
      },
      { at: addH(opened, i.hours), by: i.resolvedBy, text: `Resolved: ${i.resolution}.` },
    ],
    resolutionComments: `${i.resolution}. Time taken ${i.hours}h.`,
    rootCauseCode: CODE[i.cluster] ?? "Unknown",
  };
};

const SAMPLE: SnowIncidentDetail = {
  number: "INC24528082",
  shortDescription: "Safety Management System - Single Document Access Failure",
  project: "IEMS Safety",
  priority: "P2",
  opened: "2026-09-29T07:40:00",
  resolved: "2026-09-29T15:10:00",
  hoursToResolve: 7.5,
  resolvedBy: "A. Khoury",
  rcaStatus: "none",
  boxUrl: null,
  description:
    "A server outage impacted the IEMS Safety Management System module, preventing editing or management of a single safety document.",
  workNotes: [
    {
      at: "2026-09-29T07:45:00",
      by: "Service Desk",
      text: "Engineers at site report one safety document cannot be opened or edited. Raised as P2 due to safety constraint on planned on-site work.",
    },
    {
      at: "2026-09-29T09:10:00",
      by: "A. Khoury",
      text: "Confirmed other IEMS functions including power balancing are not impacted. Document record locked after storage node restart.",
    },
    {
      at: "2026-09-29T12:30:00",
      by: "A. Khoury",
      text: "Locked record traced to orphaned session left by the outage. Restore from last good backup prepared.",
    },
    {
      at: "2026-09-29T15:10:00",
      by: "A. Khoury",
      text: "Document restored and verified with site engineers. Incident resolved.",
    },
  ],
  resolutionComments:
    "Document restored from backup and orphaned lock cleared. Verified by site engineers. Time taken 7.5h.",
  rootCauseCode: "Software defect",
};

const OLDER: SnowIncidentDetail[] = [
  [
    "INC0029101",
    "Batch scheduler stopped overnight",
    "Data Warehouse",
    "P3",
    "2025-04-14",
    3,
    "L. Mendes",
    "Scheduler thread pool starved",
  ],
  [
    "INC0028870",
    "VPN gateway intermittent drops",
    "Customer Portal",
    "P3",
    "2025-03-21",
    2.5,
    "M. Okafor",
    "Firmware bug on gateway",
  ],
  [
    "INC0027455",
    "Telemetry ingest lag across two sites",
    "Grid Telemetry",
    "P2",
    "2025-02-06",
    6,
    "A. Khoury",
    "Queue consumer undersized",
  ],
  [
    "INC0026012",
    "Payments reconciliation job failed",
    "Payments Platform",
    "P2",
    "2025-01-09",
    5.5,
    "R. Singh",
    "Schema change not propagated",
  ],
].map(([n, t, p, pr, d, h, by, rc]) =>
  fromIncident({
    id: n as string,
    title: t as string,
    source: "ServiceNow",
    project: p as string,
    status: "resolved",
    severity: pr === "P2" ? "high" : "medium",
    rootCause: rc as string,
    resolution: "Service restored and change reverted",
    hours: h as number,
    date: d as string,
    cluster: "x",
    resolvedBy: by as string,
  }),
);

export const SNOW_INCIDENTS: SnowIncidentDetail[] = [
  SAMPLE,
  ...INCIDENTS.map(fromIncident),
  ...OLDER,
].sort((a, b) => b.opened.localeCompare(a.opened));

const T = (
  id: string,
  title: string,
  assignee: string,
  priority: Priority,
  state: ReleaseTicket["state"],
): ReleaseTicket => ({ id, title, assignee, priority, state });

export const RELEASE_ENVS: ReleaseEnv[] = [
  {
    id: "PD1",
    tickets: [
      T("REL-101", "Apply database patch bundle", "A. Patel", "P2", "done"),
      T("REL-102", "Rotate service certificates", "J. Moreno", "P3", "done"),
      T("REL-103", "Deploy ingest service v2.4", "A. Patel", "P2", "done"),
      T("REL-104", "Smoke test historian feeds", "S. Okafor", "P3", "in_progress"),
      T("REL-105", "Update monitoring dashboards", "J. Moreno", "P4", "todo"),
    ],
  },
  {
    id: "PD2",
    tickets: [
      T("REL-201", "Apply database patch bundle", "S. Okafor", "P2", "done"),
      T("REL-202", "Rotate service certificates", "L. Chen", "P3", "in_progress"),
      T("REL-203", "Deploy ingest service v2.4", "L. Chen", "P2", "todo"),
      T("REL-204", "Smoke test historian feeds", "S. Okafor", "P3", "todo"),
      T("REL-205", "Update monitoring dashboards", "J. Moreno", "P4", "todo"),
      T("REL-206", "Verify failover runbook", "A. Patel", "P1", "todo"),
    ],
  },
  {
    id: "MPR1",
    tickets: [
      T("REL-301", "Apply database patch bundle", "L. Chen", "P2", "todo"),
      T("REL-302", "Rotate service certificates", "J. Moreno", "P3", "todo"),
      T("REL-303", "Deploy ingest service v2.4", "A. Patel", "P2", "todo"),
      T("REL-304", "Smoke test historian feeds", "S. Okafor", "P3", "todo"),
    ],
  },
];
