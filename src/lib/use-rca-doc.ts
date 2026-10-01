"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "./api";
import { buildRcaDocx } from "./rca-docx";
import type { ReportImage, RcaReport } from "./types";

export const MIN_ACTIONS = 6;
export type TextField =
  | "problemTitle"
  | "problemStatement"
  | "businessImpact"
  | "investigation"
  | "serviceRestoration"
  | "nextSteps"
  | "rootCauseCode"
  | "rootCauseDetails"
  | "mitigation";

export const STATES = ["Open", "In progress", "Closed"];
const blankAction = () => ({ action: "", owner: "", due: "", state: "" });
export const pad = (r: RcaReport): RcaReport => ({
  ...r,
  images: r.images ?? [],
  actions: [
    ...r.actions,
    ...Array.from({ length: Math.max(0, MIN_ACTIONS - r.actions.length) }, blankAction),
  ],
});
export const clean = (r: RcaReport): RcaReport => ({
  ...r,
  actions: r.actions.filter((a) => a.action.trim() || a.owner.trim()),
});

export const todo = (r: RcaReport): string[] =>
  [
    !r.nextSteps.trim() && "Next steps",
    r.whys.every((w) => !w.trim()) && "5 Whys",
    !r.rootCauseDetails.trim() && "Root cause details",
    !r.mitigation.trim() && "Mitigation",
    !r.actions.some((a) => a.action.trim()) && "Corrective actions",
    r.images.length === 0 && "Screenshots",
  ].filter(Boolean) as string[];

export function resizeImage(file: File, max = 1400): Promise<ReportImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl: c.toDataURL("image/jpeg", 0.85),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} is not an image`));
    };
    img.src = url;
  });
}

export function useRcaDoc(number: string) {
  const qc = useQueryClient();
  const incident = useQuery({
    queryKey: ["snow", number],
    queryFn: () => api.snowIncident(number),
  });
  const codes = useQuery({ queryKey: ["codes"], queryFn: api.rootCauseCodes });
  const saved = useQuery({
    queryKey: ["report", number],
    queryFn: () => api.getReport(number),
    refetchOnWindowFocus: true,
  });
  const [form, setForm] = useState<RcaReport | null>(null);
  const started = useRef(false);
  const fail = (e: unknown) => toast.error((e as Error).message);

  const draft = useMutation({
    mutationFn: () => api.draftReport(number),
    onSuccess: (r) => {
      setForm(pad(r));
      qc.setQueryData(["report", number], r);
    },
    onError: fail,
  });
  const save = useMutation({
    mutationFn: () => api.saveReport(clean(form!)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["snow"] });
      toast.success("Saved");
    },
    onError: fail,
  });
  const publish = useMutation({
    mutationFn: async () => {
      const r = clean(form!);
      return api.publishReport(r, await buildRcaDocx(r));
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["snow"] });
      toast.success(`${res.fileName} uploaded to Box`, {
        action: { label: "Open", onClick: () => window.open(res.boxUrl, "_blank") },
      });
    },
    onError: fail,
  });
  const openDoc = useMutation({
    mutationFn: async (mode: "view" | "edit" = "edit") => {
      const w = window.open("about:blank", "_blank");
      try {
        await api.saveReport(clean(form!));
      } catch (e) {
        w?.close();
        throw e;
      }
      if (w) w.location.href = `/document/${number}${mode === "view" ? "?mode=view" : ""}`;
    },
    onError: fail,
  });

  useEffect(() => {
    if (saved.isLoading || started.current) return;
    started.current = true;
    if (saved.data) setForm(pad(saved.data));
    else draft.mutate();
  }, [saved.isLoading, saved.data, draft]);

  useEffect(() => {
    const html = saved.data?.documentHtml;
    setForm((f) => (f && f.documentHtml !== html ? { ...f, documentHtml: html } : f));
  }, [saved.data?.documentHtml]);

  const edit = (k: string, patch: Partial<RcaReport>) =>
    setForm((f) => (f ? { ...f, ...patch, aiFilled: f.aiFilled.filter((x) => x !== k) } : f));

  const addImages = async (files: FileList | File[]) => {
    try {
      const imgs = await Promise.all(Array.from(files).map((f) => resizeImage(f)));
      setForm((f) => (f ? { ...f, images: [...f.images, ...imgs] } : f));
    } catch (e) {
      fail(e);
    }
  };

  const download = async () => {
    const blob = await buildRcaDocx(clean(form!));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `RCA-${number}.docx`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return {
    incident,
    codes,
    form,
    setForm,
    edit,
    addImages,
    draft,
    save,
    publish,
    openDoc,
    download,
  };
}
