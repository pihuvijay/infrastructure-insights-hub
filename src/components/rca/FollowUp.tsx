"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { streamChat } from "@/lib/api";
import type { ChatMsg } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "Who has fixed this before?",
  "What permanent fix would prevent it?",
  "Is it getting worse?",
];

export function FollowUp({
  incidentIds,
  clusterId,
}: {
  incidentIds: string[];
  clusterId: string | null;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => () => ctrl.current?.abort(), []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  const send = async (q: string) => {
    if (busy || !q.trim()) return;
    const history: ChatMsg[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setText("");
    setBusy(true);
    setError(null);
    ctrl.current = new AbortController();
    try {
      let out = "";
      for await (const c of streamChat(history, { clusterId, incidentIds }, ctrl.current.signal)) {
        out += c;
        setMessages([...history, { role: "assistant", content: out }]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message);
        setMessages(history);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 border-t pt-4">
      <div className="space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "text-sm leading-relaxed",
              m.role === "user"
                ? "ml-10 rounded-xl rounded-br-sm bg-brand px-3.5 py-2 text-white"
                : "whitespace-pre-wrap",
            )}
          >
            {m.content || (
              <span className="inline-flex gap-1 py-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 animate-pulse rounded-full bg-muted-foreground"
                    style={{ animationDelay: `${d * 150}ms` }}
                  />
                ))}
              </span>
            )}
          </div>
        ))}
        {error && (
          <div className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PROMPTS.map((p) => (
          <button
            key={p}
            disabled={busy}
            onClick={() => send(p)}
            className="rounded-full border bg-surface px-2.5 py-1 text-[11.5px] text-secondary-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
        className="mt-2.5 flex items-center gap-2 rounded-xl border bg-card p-2 focus-within:ring-2 focus-within:ring-ring"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask a follow-up about these incidents…"
          className="h-8 flex-1 bg-transparent px-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => ctrl.current?.abort()}
            aria-label="Stop"
            className="grid size-8 place-items-center rounded-lg bg-surface"
          >
            <Square className="size-3.5" />
          </button>
        ) : (
          <button
            aria-label="Send"
            disabled={!text.trim()}
            className="grid size-8 place-items-center rounded-lg bg-brand text-white disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </form>
    </div>
  );
}
