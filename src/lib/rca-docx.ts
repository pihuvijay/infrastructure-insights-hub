import { reportToHtml } from "./rca-html";
import type { RcaReport } from "./types";

const MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function htmlToDocx(html: string): Promise<Blob> {
  const { default: convert } = await import("html-to-docx");
  const out = await convert(`<!DOCTYPE html><html><body>${html}</body></html>`, undefined, {
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
  });
  return out instanceof Blob ? out : new Blob([out as BlobPart], { type: MIME });
}

export const buildRcaDocx = (r: RcaReport) => htmlToDocx(r.documentHtml ?? reportToHtml(r));
