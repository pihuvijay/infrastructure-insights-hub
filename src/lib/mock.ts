import {
  CLUSTERS,
  ENVIRONMENTS,
  FOLDERS,
  INCIDENTS,
  INSIGHTS,
  MOCK_NOW,
  PEOPLE,
  PROJECTS,
  RELEASE_ENVS,
  ROOT_CAUSE_CODES,
  SNOW_INCIDENTS,
} from "./mock-data";
import type {
  ChatContext,
  ChatMsg,
  Cluster,
  Connection,
  Env,
  FilterOptions,
  Folder,
  Incident,
  Insights,
  PublishResult,
  RcaReport,
  ReleaseEnv,
  ScoredIncident,
  SearchRequest,
  SearchResponse,
  SnowIncident,
  SnowIncidentDetail,
  UploadItem,
} from "./types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DAY = 86_400_000;
const RANGE_DAYS = { "30d": 30, "90d": 90, "1y": 365, all: Infinity } as const;

let envs: Env[] = ENVIRONMENTS.map((e) => ({ ...e }));
let uploads: UploadItem[] = [];
let connections: Connection[] = [
  {
    id: "servicenow",
    name: "ServiceNow",
    desc: "Resolved incidents, change records and work notes",
    scope: "Incidents resolved in the last 12 months",
    status: "disconnected",
    account: null,
    lastSync: null,
    records: 0,
  },
  {
    id: "box",
    name: "Box",
    desc: "Post-mortems and RCA documents",
    scope: "Folder: Service Delivery / RCA",
    status: "disconnected",
    account: null,
    lastSync: null,
    records: 0,
  },
];

export const mockFolders = async (): Promise<Folder[]> => FOLDERS;
export const mockEnvironments = async (): Promise<Env[]> => envs;
export const mockInsights = async (): Promise<Insights> => INSIGHTS;
export const mockFilterOptions = async (): Promise<FilterOptions> => ({
  projects: PROJECTS,
  people: PEOPLE,
});

export async function mockNotify(id: string): Promise<Env[]> {
  await wait(300);
  envs = envs.map((e) => (e.id === id ? { ...e, notified: true } : e));
  return envs;
}

export async function mockApplyLatest(id: string): Promise<Env[]> {
  await wait(400);
  envs = envs.map((e) =>
    e.id === id
      ? {
          ...e,
          snapshot: e.latestAvailable,
          by: "pihuvijay",
          when: new Date().toISOString(),
          status: "synced",
          notified: false,
        }
      : e,
  );
  return envs;
}

export async function mockConnections(): Promise<Connection[]> {
  return connections;
}

const patchConn = (id: string, p: Partial<Connection>) => {
  connections = connections.map((c) => (c.id === id ? { ...c, ...p } : c));
};

export async function mockConnect(id: Connection["id"]): Promise<Connection[]> {
  patchConn(id, { status: "connecting" });
  await wait(1200);
  patchConn(id, {
    status: "syncing",
    account: id === "box" ? "gev-delivery.box.com" : "gev.service-now.com",
  });
  setTimeout(
    () =>
      patchConn(id, {
        status: "connected",
        lastSync: new Date().toISOString(),
        records: id === "box" ? 64 : 412,
      }),
    2500,
  );
  return connections;
}

export async function mockSync(id: Connection["id"]): Promise<Connection[]> {
  patchConn(id, { status: "syncing" });
  setTimeout(
    () => patchConn(id, { status: "connected", lastSync: new Date().toISOString() }),
    1800,
  );
  return connections;
}

export async function mockDisconnect(id: Connection["id"]): Promise<Connection[]> {
  await wait(250);
  patchConn(id, { status: "disconnected", account: null, lastSync: null, records: 0 });
  return connections;
}

export async function mockUploads(): Promise<UploadItem[]> {
  return uploads;
}

export async function mockUpload(files: File[]): Promise<UploadItem[]> {
  const added = files.map((f) => ({
    id: crypto.randomUUID(),
    name: f.name,
    size: f.size,
    status: "processing" as const,
  }));
  uploads = [...added, ...uploads];
  added.forEach((a) =>
    setTimeout(
      () => {
        uploads = uploads.map((u) =>
          u.id === a.id ? { ...u, status: a.size > 20e6 ? "failed" : "indexed" } : u,
        );
      },
      1200 + Math.random() * 1800,
    ),
  );
  return uploads;
}

const tokens = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
const score = (q: string[], text: string) => {
  if (!q.length) return 0;
  const t = text.toLowerCase();
  return q.filter((w) => t.includes(w.slice(0, 5))).length / q.length;
};

const daysAgo = (iso: string) => (Date.parse(MOCK_NOW) - Date.parse(iso)) / DAY;

function filterIncidents(req: SearchRequest, extra: string[]): ScoredIncident[] {
  const { filters: f } = req;
  const q = [...tokens(req.query), ...extra];
  return INCIDENTS.filter((i) => daysAgo(i.date) <= RANGE_DAYS[f.range])
    .filter((i) => f.project === "all" || i.project === f.project)
    .filter((i) => f.source === "all" || i.source === f.source)
    .filter((i) => f.status === "all" || i.status === f.status)
    .filter((i) => f.resolvedBy === "all" || i.resolvedBy === f.resolvedBy)
    .map((i) => ({
      ...i,
      score: q.length ? score(q, `${i.title} ${i.rootCause} ${i.resolution} ${i.project}`) : 0,
    }))
    .filter((i) => !q.length || i.score > 0)
    .sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
}

const people = (list: Incident[]) => {
  const m = new Map<string, number>();
  list.forEach((i) => m.set(i.resolvedBy, (m.get(i.resolvedBy) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

export async function mockSearch(req: SearchRequest, files: File[]): Promise<SearchResponse> {
  await wait(700);
  const fileTokens = files.flatMap((f) => tokens(f.name.replace(/\.[^.]+$/, "")));
  const incidents = filterIncidents(req, fileTokens);
  const hasIntent = !!req.query.trim() || files.length > 0;
  if (!hasIntent) return { answer: null, incidents, cluster: null };

  const top = incidents.slice(0, 6);
  const cluster = (top[0] && CLUSTERS.find((c) => c.id === top[0]?.cluster)) || null;
  if (!top.length)
    return {
      answer:
        "No past incidents match these filters. Try widening the date range or clearing the project filter.",
      incidents,
      cluster: null,
    };

  const hrs = top.reduce((a, i) => a + i.hours, 0);
  const lead = `Found ${incidents.length} related incident${incidents.length > 1 ? "s" : ""} (${top.length} strongest shown, ${hrs}h to resolve).`;
  const who = people(top)
    .map(([n, c]) => `• ${n} — ${c} incident${c > 1 ? "s" : ""}`)
    .join("\n");
  const answers = {
    similar: `${lead}\n${cluster ? `Pattern: ${cluster.name} (${cluster.incidents} incidents overall).` : ""}\nClosest: ${top[0]?.id} — ${top[0]?.title}.`,
    resolvers: `${lead}\nResolved by:\n${who}\nMost recent: ${top[0]?.resolvedBy} on ${top[0]?.id}.`,
    root_cause: `${lead}\nMost common root causes:\n${[...new Set(top.map((i) => i.rootCause))]
      .slice(0, 3)
      .map((r) => `• ${r}`)
      .join("\n")}`,
    fix: `${lead}\nWhat worked before:\n${[...new Set(top.map((i) => i.resolution))]
      .slice(0, 3)
      .map((r) => `• ${r}`)
      .join("\n")}${cluster ? `\nPermanent fix: ${cluster.fix}` : ""}`,
  };
  return { answer: answers[req.task], incidents, cluster };
}

function chatAnswer(messages: ChatMsg[], ctx: ChatContext): string {
  const last = (messages.at(-1)?.content ?? "").toLowerCase();
  const cluster: Cluster | undefined =
    CLUSTERS.find((c) => c.id === ctx.clusterId) ??
    (ctx.incidentIds[0]
      ? CLUSTERS.find((c) => c.id === INCIDENTS.find((i) => i.id === ctx.incidentIds[0])?.cluster)
      : undefined);
  const related = ctx.incidentIds.length
    ? INCIDENTS.filter((i) => ctx.incidentIds.includes(i.id))
    : cluster
      ? INCIDENTS.filter((i) => i.cluster === cluster.id)
      : INCIDENTS;
  const top = [...CLUSTERS].sort((a, b) => b.hoursSavable - a.hoursSavable)[0];

  if (ctx.focus && last.startsWith("what stands out"))
    return `${ctx.focus.label}\n• ${ctx.focus.summary}\n${cluster ? `• ${cluster.summary}\n• Fix: ${cluster.fix}` : `• Biggest savable cluster overall: ${top?.name} (${top?.hoursSavable}h)\n• Ask who resolved these, the permanent fix, or the trend.`}`;
  if (/who|resolv/.test(last))
    return `Resolvers${cluster ? ` for ${cluster.name}` : ""}:\n${people(related)
      .map(([n, c]) => `• ${n} — ${c}`)
      .join("\n")}`;
  if (/fix|permanent|prevent/.test(last))
    return cluster
      ? `Permanent fix: ${cluster.fix}\n• Saves ~${cluster.hoursSavable}h of ${cluster.hoursSpent}h spent\n• Affects ${cluster.incidents} incidents`
      : `Start with ${top?.name}: ${top?.fix}\n• Saves ~${top?.hoursSavable}h`;
  if (/worse|trend|often|how many/.test(last))
    return cluster
      ? `${cluster.incidents} incidents in 6 months.\n• Monthly: ${cluster.trend.join(", ")}\n• ${cluster.trend.at(-1)! >= cluster.trend[0]! ? "Rising" : "Falling"} since April.`
      : "23 incidents in September, up from 17 in August.\n• Avg resolution 7.9h.";
  if (/first|priority|time|lost/.test(last))
    return `Fix ${top?.name} first.\n• ${top?.hoursSpent}h spent, ${top?.hoursSavable}h savable\n• ${top?.incidents} incidents, severity ${top?.severity}`;
  if (cluster)
    return `${cluster.name}: ${cluster.summary}\n• ${cluster.incidents} incidents, ${cluster.hoursSpent}h spent\n• ${cluster.hoursSavable}h savable with: ${cluster.fix}`;
  return `${CLUSTERS.length} recurring clusters found.\n${CLUSTERS.map((c) => `• ${c.name}: ${c.hoursSavable}h savable`).join("\n")}`;
}

export async function* mockChat(
  messages: ChatMsg[],
  ctx: ChatContext,
  signal: AbortSignal,
): AsyncGenerator<string> {
  await wait(500);
  for (const word of chatAnswer(messages, ctx).split(/(\s+)/)) {
    if (signal.aborted) return;
    yield word;
    await wait(18);
  }
}

const KEY = "gev-mock-rca";
type Stored = {
  reports: Record<string, RcaReport>;
  status: Record<string, { rcaStatus: SnowIncident["rcaStatus"]; boxUrl: string | null }>;
};
const load = (): Stored => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "") as Stored;
  } catch {
    return { reports: {}, status: {} };
  }
};
const store = (fn: (s: Stored) => void) => {
  const s = load();
  fn(s);
  localStorage.setItem(KEY, JSON.stringify(s));
};
const snowNow = (): SnowIncidentDetail[] => {
  const { status } = load();
  return SNOW_INCIDENTS.map((i) => ({ ...i, ...status[i.number] }));
};

export const mockRootCauseCodes = async (): Promise<string[]> => ROOT_CAUSE_CODES;

export async function mockSnowIncidents(): Promise<SnowIncident[]> {
  return snowNow().map(
    ({ description: _d, workNotes: _w, resolutionComments: _r, rootCauseCode: _c, ...i }) => i,
  );
}

export async function mockSnowIncident(number: string): Promise<SnowIncidentDetail> {
  const i = snowNow().find((s) => s.number === number);
  if (!i) throw new Error(`Incident ${number} not found`);
  return i;
}

const fmtT = (iso: string) => iso.replace("T", " ").slice(0, 16);

export async function mockGetReport(number: string): Promise<RcaReport | null> {
  return load().reports[number] ?? null;
}

export async function mockDraftReport(number: string): Promise<RcaReport> {
  await wait(700);
  const i = await mockSnowIncident(number);
  const report: RcaReport = {
    problemNumber: i.number,
    problemTitle: i.shortDescription,
    problemStatement: i.description,
    businessImpact: `${i.priority} incident affecting ${i.project}. Resolution took ${i.hoursToResolve}h from ${fmtT(i.opened)} to ${fmtT(i.resolved)}.`,
    timeline: i.workNotes.map((n) => ({ time: fmtT(n.at), event: n.text })),
    investigation: i.workNotes
      .filter((n) => n.by !== "Service Desk")
      .map((n) => `${fmtT(n.at)} - ${n.by}: ${n.text}`)
      .join("\n"),
    serviceRestoration: i.resolutionComments,
    nextSteps: "",
    rootCauseCode: i.rootCauseCode,
    whys: ["", "", "", "", ""],
    rootCauseDetails: "",
    mitigation: "",
    actions: [],
    images: [],
    aiFilled: [
      "problemTitle",
      "problemStatement",
      "businessImpact",
      "timeline",
      "investigation",
      "serviceRestoration",
      "rootCauseCode",
    ],
  };
  store((d) => {
    d.reports[number] = report;
  });
  return report;
}

export async function mockSaveReport(report: RcaReport): Promise<RcaReport> {
  await wait(250);
  store((d) => {
    d.reports[report.problemNumber] = report;
    if (!d.status[report.problemNumber])
      d.status[report.problemNumber] = { rcaStatus: "draft", boxUrl: null };
  });
  return report;
}

export async function mockPublishReport(report: RcaReport, blob: Blob): Promise<PublishResult> {
  await wait(1200);
  void blob;
  const fileName = `RCA-${report.problemNumber}.docx`;
  const boxUrl = "#";
  store((d) => {
    d.reports[report.problemNumber] = report;
    d.status[report.problemNumber] = { rcaStatus: "published", boxUrl };
  });
  return { fileName, boxUrl };
}

export async function mockWordUrl(): Promise<string> {
  throw new Error("Word Online needs the live Box connection. It is unavailable in mock mode.");
}

export const mockReleaseEnvs = async (): Promise<ReleaseEnv[]> => RELEASE_ENVS;
