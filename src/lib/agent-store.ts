import { useSyncExternalStore } from "react";
import type { Cluster } from "./data";

export type Msg = { role: "user" | "assistant"; content: string };
type State = { open: boolean; cluster: Cluster | null; messages: Msg[]; busy: boolean; error: string | null };

let state: State = { open: false, cluster: null, messages: [], busy: false, error: null };
const subs = new Set<() => void>();
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };

export const useAgent = () =>
  useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state, () => state);

let controller: AbortController | null = null;

export function openAgent(cluster: Cluster | null) {
  controller?.abort();
  set({ open: true, cluster, messages: [], busy: false, error: null });
  if (cluster) void ask(`Brief me on the "${cluster.name}" cluster.`);
}
export const closeAgent = () => { controller?.abort(); set({ open: false, busy: false }); };
export const stopAgent = () => { controller?.abort(); set({ busy: false }); };

export async function ask(text: string) {
  if (state.busy || !text.trim()) return;
  const messages: Msg[] = [...state.messages, { role: "user", content: text }];
  set({ messages: [...messages, { role: "assistant", content: "" }], busy: true, error: null });
  controller = new AbortController();
  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, clusterId: state.cluster?.id ?? null }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw new Error((await res.text()) || `Request failed (${res.status})`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      out += dec.decode(value, { stream: true });
      set({ messages: [...messages, { role: "assistant", content: out }] });
    }
    if (!out) set({ messages: [...messages, { role: "assistant", content: "No answer was returned." }] });
  } catch (e) {
    if ((e as Error).name !== "AbortError") set({ error: (e as Error).message, messages });
  } finally {
    set({ busy: false });
  }
}
