import { useEffect, useRef, useState } from "react";
import { Bot, X, ArrowUp, Square, Tag } from "lucide-react";
import { useAgent, ask, closeAgent, stopAgent, openAgent } from "@/lib/agent-store";
import { cn } from "@/lib/utils";

const GENERAL = ["Which cluster should we fix first?", "Where is most time being lost?", "Summarise this month's trend"];
const CLUSTER_Q = ["How often has this come up?", "Who has been resolving these?", "What permanent fix would save the most hours?", "Is it getting worse?"];

export function AgentPanel() {
  const { open, cluster, messages, busy, error } = useAgent();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages]);
  useEffect(() => { if (open && !busy) inputRef.current?.focus(); }, [open, busy, cluster]);

  if (!open) return null;
  const send = (q: string) => { void ask(q); setText(""); };
  const prompts = cluster ? CLUSTER_Q : GENERAL;

  return (
    <aside className="sticky top-0 flex h-screen w-[380px] shrink-0 flex-col border-l bg-sidebar animate-in slide-in-from-right-4 fade-in">
      <header className="flex items-center gap-3 border-b px-4 py-3.5">
        <div className="icon-tile size-8"><Bot className="size-4" /></div>
        <div className="flex-1 leading-tight">
          <div className="text-sm font-semibold">Advisor agent</div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />Pipeline live · 5 agents</div>
        </div>
        <button onClick={closeAgent} aria-label="Close agent" className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
      </header>

      {cluster && (
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <Tag className="size-3.5 text-primary" />
          <span className="truncate rounded-md bg-primary-soft px-2 py-0.5 text-xs text-primary">{cluster.name}</span>
          <button onClick={() => openAgent(null)} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground">Untag</button>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Ask anything about your incidents. Click a cluster to tag it in.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("text-sm leading-relaxed", m.role === "user" ? "ml-8 rounded-xl rounded-br-sm bg-primary px-3.5 py-2.5 text-primary-foreground" : "whitespace-pre-wrap text-foreground")}>
            {m.content || <span className="inline-flex gap-1 py-1">{[0, 1, 2].map((d) => <span key={d} className="size-1.5 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 150}ms` }} />)}</span>}
          </div>
        ))}
        {error && <div className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</div>}
        <div ref={endRef} />
      </div>

      <div className="border-t p-3">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {prompts.map((p) => (
            <button key={p} disabled={busy} onClick={() => send(p)} className="rounded-full border bg-surface px-2.5 py-1 text-[11.5px] text-secondary-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-50">{p}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-end gap-2 rounded-xl border bg-card p-2 focus-within:ring-2 focus-within:ring-ring">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
            placeholder={cluster ? "Ask about this cluster…" : "Ask the agent…"}
            className="max-h-32 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {busy
            ? <button type="button" onClick={stopAgent} aria-label="Stop" className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface"><Square className="size-3.5" /></button>
            : <button aria-label="Send" disabled={!text.trim()} className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"><ArrowUp className="size-4" /></button>}
        </form>
      </div>
    </aside>
  );
}
