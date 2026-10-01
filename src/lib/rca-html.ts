import type { RcaReport } from "./types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const paras = (s: string) =>
  s.trim()
    ? s
        .split("\n")
        .map((l) => `<p>${esc(l)}</p>`)
        .join("")
    : "<p></p>";
const field = (label: string, value: string) => `<p><strong>${label}</strong></p>${paras(value)}`;
const table = (head: string[], rows: string[][]) =>
  `<table><tbody><tr>${head.map((h) => `<th><p>${h}</p></th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td><p>${esc(c)}</p></td>`).join("")}</tr>`).join("")}</tbody></table>`;

export function reportToHtml(r: RcaReport): string {
  const actions = r.actions.filter((a) => a.action.trim() || a.owner.trim());
  const rows = Array.from({ length: Math.max(6, actions.length) }, (_, i) => {
    const a = actions[i];
    return [String(i + 1), a?.action ?? "", a?.owner ?? "", a?.due ?? "", a?.state ?? ""];
  });
  return [
    "<h1>Root Cause Analysis (RCA) Report</h1>",
    field("Problem Number:", r.problemNumber),
    field("Problem Statement", r.problemTitle),
    "<h2>Problem Statement</h2>",
    field("Problem Statement:", r.problemStatement),
    field("Business Impact:", r.businessImpact),
    "<h2>Investigation</h2>",
    "<p><strong>Timeline:</strong> high-level timeline of key events from incident report to resolution</p>",
    table(
      ["Time", "Event"],
      r.timeline.map((t) => [t.time, t.event]),
    ),
    field("Investigation:", r.investigation),
    ...r.images.map((i) => `<p><img src="${i.dataUrl}" alt="${esc(i.name)}" /></p>`),
    field("Service Restoration:", r.serviceRestoration),
    field("Next Steps:", r.nextSteps),
    "<h2>Root Cause</h2>",
    field("Root Cause Code:", r.rootCauseCode),
    "<p><strong>5 Whys:</strong></p>",
    `<ol>${r.whys.map((w) => `<li><p>${esc(w)}</p></li>`).join("")}</ol>`,
    field("Root Cause Details:", r.rootCauseDetails),
    "<h2>Mitigation</h2>",
    paras(r.mitigation),
    "<h2>Corrective Actions</h2>",
    "<p>Actions should be raised into ServiceNow directly. If your team has no access to ServiceNow enter actions below.</p>",
    table(["Number", "Action", "Owner", "Due Date", "State"], rows),
  ].join("");
}
