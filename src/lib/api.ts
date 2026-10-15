import * as mock from "./mock";
import type {
  ChatContext,
  ChatMsg,
  Connection,
  Env,
  FilterOptions,
  Folder,
  Insights,
  PublishResult,
  RcaReport,
  ReleaseEnv,
  SnowIncident,
  SnowIncidentDetail,
  SearchRequest,
  SearchResponse,
  UploadItem,
} from "./types";

const LIVE = process.env.NEXT_PUBLIC_API_MODE === "live";
const BASE = "/api/v1";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error((await res.text()) || `Request failed (${res.status})`);
  return res.json() as Promise<T>;
}
const post = <T>(path: string, body?: unknown) =>
  http<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? null : JSON.stringify(body),
  });

export const api = {
  folders: (): Promise<Folder[]> => (LIVE ? http("/tools/folders") : mock.mockFolders()),
  insights: (): Promise<Insights> => (LIVE ? http("/rca/insights") : mock.mockInsights()),
  filterOptions: (): Promise<FilterOptions> =>
    LIVE ? http("/rca/filters") : mock.mockFilterOptions(),

  releaseEnvs: (): Promise<ReleaseEnv[]> =>
    LIVE ? http("/release/environments") : mock.mockReleaseEnvs(),

  environments: (): Promise<Env[]> => (LIVE ? http("/environments") : mock.mockEnvironments()),
  notifyManager: (id: string): Promise<Env[]> =>
    LIVE ? post(`/environments/${id}/notify`) : mock.mockNotify(id),
  applyLatestSnapshot: (id: string): Promise<Env[]> =>
    LIVE ? post(`/environments/${id}/snapshots/apply-latest`) : mock.mockApplyLatest(id),

  connections: (): Promise<Connection[]> =>
    LIVE ? http("/rca/connections") : mock.mockConnections(),
  connect: (id: Connection["id"]): Promise<Connection[]> =>
    LIVE ? post(`/rca/connections/${id}/connect`) : mock.mockConnect(id),
  syncConnection: (id: Connection["id"]): Promise<Connection[]> =>
    LIVE ? post(`/rca/connections/${id}/sync`) : mock.mockSync(id),
  disconnect: (id: Connection["id"]): Promise<Connection[]> =>
    LIVE ? http(`/rca/connections/${id}`, { method: "DELETE" }) : mock.mockDisconnect(id),

  uploads: (): Promise<UploadItem[]> => (LIVE ? http("/rca/uploads") : mock.mockUploads()),
  upload: (files: File[]): Promise<UploadItem[]> => {
    if (!LIVE) return mock.mockUpload(files);
    const body = new FormData();
    files.forEach((f) => body.append("files", f));
    return http("/rca/uploads", { method: "POST", body });
  },

  rootCauseCodes: (): Promise<string[]> =>
    LIVE ? http("/rca/root-cause-codes") : mock.mockRootCauseCodes(),
  snowIncidents: (): Promise<SnowIncident[]> =>
    LIVE ? http("/rca/incidents") : mock.mockSnowIncidents(),
  snowIncident: (n: string): Promise<SnowIncidentDetail> =>
    LIVE ? http(`/rca/incidents/${n}`) : mock.mockSnowIncident(n),
  getReport: (n: string): Promise<RcaReport | null> =>
    LIVE ? http(`/rca/reports/${n}`) : mock.mockGetReport(n),
  draftReport: (n: string): Promise<RcaReport> =>
    LIVE ? post(`/rca/reports/${n}/draft`) : mock.mockDraftReport(n),
  saveReport: (r: RcaReport): Promise<RcaReport> =>
    LIVE
      ? http(`/rca/reports/${r.problemNumber}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        })
      : mock.mockSaveReport(r),
  publishReport: (r: RcaReport, docx: Blob): Promise<PublishResult> => {
    if (!LIVE) return mock.mockPublishReport(r, docx);
    const body = new FormData();
    body.append("report", JSON.stringify(r));
    body.append("file", docx, `RCA-${r.problemNumber}.docx`);
    return http(`/rca/reports/${r.problemNumber}/publish`, { method: "POST", body });
  },

  wordOnlineUrl: (n: string): Promise<string> =>
    LIVE
      ? http<{ url: string }>(`/rca/reports/${n}/word-url`).then((r) => r.url)
      : mock.mockWordUrl(),
  search: (req: SearchRequest, files: File[]): Promise<SearchResponse> => {
    if (!LIVE) return mock.mockSearch(req, files);
    const body = new FormData();
    body.append("payload", JSON.stringify(req));
    files.forEach((f) => body.append("files", f));
    return http("/rca/search", { method: "POST", body });
  },
};

type SseEvent = { event: string; data: string };

async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    buf += dec.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    for (let i = buf.indexOf("\n\n"); i >= 0; i = buf.indexOf("\n\n")) {
      const block = buf.slice(0, i);
      buf = buf.slice(i + 2);
      let event = "message";
      const data: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith(":")) continue;
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
      }
      if (data.length) yield { event, data: data.join("\n") };
    }
    if (done) return;
  }
}

export async function* streamChat(
  messages: ChatMsg[],
  ctx: ChatContext,
  signal: AbortSignal,
): AsyncGenerator<string> {
  if (!LIVE) return yield* mock.mockChat(messages, ctx, signal);
  const res = await fetch(`${BASE}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({
      messages,
      clusterId: ctx.clusterId,
      incidentIds: ctx.incidentIds,
      focus: ctx.focus ?? null,
    }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error((await res.text()) || `Request failed (${res.status})`);
  for await (const e of sseEvents(res.body)) {
    if (e.event === "done") return;
    if (e.event === "error") throw new Error((JSON.parse(e.data) as { message: string }).message);
    yield JSON.parse(e.data) as string;
  }
  throw new Error("Stream ended unexpectedly");
}
