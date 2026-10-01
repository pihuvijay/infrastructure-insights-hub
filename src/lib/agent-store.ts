"use client";

import { useSyncExternalStore } from "react";
import { streamChat } from "./api";
import type { AgentFocus, ChatContext, ChatMsg, Cluster } from "./types";

type State = {
  open: boolean;
  cluster: Cluster | null;
  focus: AgentFocus | null;
  incidentIds: string[];
  messages: ChatMsg[];
  busy: boolean;
  error: string | null;
};

let state: State = {
  open: false,
  cluster: null,
  focus: null,
  incidentIds: [],
  messages: [],
  busy: false,
  error: null,
};
const subs = new Set<() => void>();
const set = (p: Partial<State>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f());
};

export const useAgent = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
    () => state,
  );

let controller: AbortController | null = null;

export function openAgent(cluster: Cluster | null, firstQuestion?: string, focus?: AgentFocus) {
  controller?.abort();
  set({
    open: true,
    cluster,
    focus: focus ?? null,
    incidentIds: [],
    messages: [],
    busy: false,
    error: null,
  });
  if (firstQuestion) void ask(firstQuestion);
  else if (focus) void ask(`What stands out about "${focus.label}" and what should we do?`);
  else if (cluster) void ask(`Brief me on the "${cluster.name}" cluster.`);
}
export const closeAgent = () => {
  controller?.abort();
  set({ open: false, busy: false });
};
export const stopAgent = () => {
  controller?.abort();
  set({ busy: false });
};

export async function ask(text: string) {
  if (state.busy || !text.trim()) return;
  const messages: ChatMsg[] = [...state.messages, { role: "user", content: text }];
  set({ messages: [...messages, { role: "assistant", content: "" }], busy: true, error: null });
  controller = new AbortController();
  const ctx: ChatContext = {
    clusterId: state.cluster?.id ?? null,
    incidentIds: state.incidentIds,
    focus: state.focus,
  };
  try {
    let out = "";
    for await (const chunk of streamChat(messages, ctx, controller.signal)) {
      out += chunk;
      set({ messages: [...messages, { role: "assistant", content: out }] });
    }
    if (!out)
      set({ messages: [...messages, { role: "assistant", content: "No answer was returned." }] });
  } catch (e) {
    if ((e as Error).name !== "AbortError") set({ error: (e as Error).message, messages });
  } finally {
    set({ busy: false });
  }
}
