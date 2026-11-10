export type EnvStatus = "synced" | "stale";
export interface Env {
  id: string;
  snapshot: string;
  by: string;
  when: string;
  status: EnvStatus;
  notified: boolean;
  latestAvailable: string;
}

export interface Tool {
  name: string;
  desc: string;
  url: string;
}
export interface Folder {
  name: string;
  tools: Tool[];
}

export type Severity = "critical" | "high" | "medium";
export type IncidentSource = "ServiceNow" | "Box" | "Upload";
export type IncidentStatus = "resolved" | "workaround" | "open";

export interface Incident {
  id: string;
  title: string;
  source: IncidentSource;
  project: string;
  severity: Severity;
  status: IncidentStatus;
  rootCause: string;
  resolution: string;
  hours: number;
  date: string;
  cluster: string;
  resolvedBy: string;
}

export interface Cluster {
  id: string;
  name: string;
  severity: Severity;
  summary: string;
  fix: string;
  incidents: number;
  hoursSpent: number;
  hoursSavable: number;
  trend: number[];
}

export type SearchTask = "similar" | "resolvers" | "root_cause" | "fix";
export type DateRange = "30d" | "90d" | "1y" | "all";

export interface SearchFilters {
  range: DateRange;
  project: string;
  source: IncidentSource | "all";
  status: IncidentStatus | "all";
  resolvedBy: string;
}

export interface SearchRequest {
  query: string;
  task: SearchTask;
  filters: SearchFilters;
}

export interface ScoredIncident extends Incident {
  score: number;
}

export interface SearchResponse {
  answer: string | null;
  incidents: ScoredIncident[];
  cluster: Cluster | null;
}

export interface FilterOptions {
  projects: string[];
  people: string[];
}

export type UploadStatus = "processing" | "indexed" | "failed";
export interface UploadItem {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
}

export type ConnectionStatus = "disconnected" | "connecting" | "syncing" | "connected";
export interface Connection {
  id: "servicenow" | "box";
  name: string;
  desc: string;
  scope: string;
  status: ConnectionStatus;
  account: string | null;
  lastSync: string | null;
  records: number;
}

export interface MonthlyPoint {
  month: string;
  incidents: number;
  avgHours: number;
}
export interface Insights {
  clusters: Cluster[];
  monthly: MonthlyPoint[];
  rootCauses: { name: string; value: number }[];
  subsystems: { name: string; critical: number; high: number; medium: number }[];
  heatmap: { name: string; hours: number[] }[];
  agents: { id: string; name: string; desc: string }[];
}

export type ChatMsg = { role: "user" | "assistant"; content: string };
export interface AgentFocus {
  label: string;
  summary: string;
}
export interface ChatContext {
  clusterId: string | null;
  incidentIds: string[];
  focus?: AgentFocus | null;
  mode?: "pipeline" | "agent";
}

export type RcaStatus = "none" | "draft" | "published";
export type Priority = "P1" | "P2" | "P3" | "P4";

export interface WorkNote {
  at: string;
  by: string;
  text: string;
}

export interface SnowIncident {
  number: string;
  shortDescription: string;
  project: string;
  priority: Priority;
  opened: string;
  resolved: string;
  hoursToResolve: number;
  resolvedBy: string;
  rcaStatus: RcaStatus;
  boxUrl: string | null;
}

export interface SnowIncidentDetail extends SnowIncident {
  description: string;
  workNotes: WorkNote[];
  resolutionComments: string;
  rootCauseCode: string;
}

export interface TimelineRow {
  time: string;
  event: string;
}
export interface ActionRow {
  action: string;
  owner: string;
  due: string;
  state: string;
}

export interface ReportImage {
  id: string;
  name: string;
  dataUrl: string;
}

export interface RcaReport {
  problemNumber: string;
  problemTitle: string;
  problemStatement: string;
  businessImpact: string;
  timeline: TimelineRow[];
  investigation: string;
  serviceRestoration: string;
  nextSteps: string;
  rootCauseCode: string;
  whys: string[];
  rootCauseDetails: string;
  mitigation: string;
  actions: ActionRow[];
  images: ReportImage[];
  aiFilled: string[];
  documentHtml?: string;
}

export interface PublishResult {
  fileName: string;
  boxUrl: string;
}

export type TicketState = "todo" | "in_progress" | "done";
export interface ReleaseTicket {
  id: string;
  title: string;
  assignee: string;
  priority: Priority;
  state: TicketState;
}
export interface ReleaseEnv {
  id: string;
  tickets: ReleaseTicket[];
}
