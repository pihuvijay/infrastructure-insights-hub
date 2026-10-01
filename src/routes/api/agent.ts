import { createFileRoute } from "@tanstack/react-router";
import { CLUSTERS, INCIDENTS, MONTHLY, ROOT_CAUSES, SUBSYSTEMS } from "@/lib/data";

type Msg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured.", { status: 500 });
        const body = (await request.json().catch(() => null)) as { messages?: Msg[]; clusterId?: string | null } | null;
        const messages = (body?.messages ?? []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-20);
        if (!messages.length) return new Response("No message.", { status: 400 });
        const cluster = CLUSTERS.find((c) => c.id === body?.clusterId);

        const system = `You are the Advisor agent in GEV System Delivery's multi-agent RCA pipeline (Ingest → Embed → Cluster → Impact → Advisor) for a critical infrastructure service delivery team.
Answer in plain text (no markdown headings, no tables). Be brief: max ~120 words, short lines, use "• " bullets. Lead with numbers. Ground every answer in the data below; if something isn't in the data, say so.
${cluster ? `FOCUSED CLUSTER: ${JSON.stringify(cluster)}\nRELATED INCIDENTS: ${JSON.stringify(INCIDENTS.filter((i) => i.cluster === cluster.id))}` : ""}
ALL CLUSTERS: ${JSON.stringify(CLUSTERS)}
MONTHLY (incidents, avg resolution hours): ${JSON.stringify(MONTHLY)}
ROOT CAUSES: ${JSON.stringify(ROOT_CAUSES)}
SUBSYSTEMS by severity: ${JSON.stringify(SUBSYSTEMS)}`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          signal: request.signal,
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
          body: JSON.stringify({
            model: "openai/gpt-6-astra",
            instructions: system,
            input: messages.map((m) => ({ role: m.role, content: m.content })),
            stream: true,
            store: false,
            reasoning: { effort: "low", summary: "auto" },
            include: ["reasoning.encrypted_content"],
          }),
        });
        if (!upstream.ok || !upstream.body) {
          const t = await upstream.text();
          const msg = upstream.status === 402 ? "AI credits have run out for this workspace." : upstream.status === 429 ? "Too many requests — try again in a moment." : `AI request failed (${upstream.status}). ${t.slice(0, 200)}`;
          return new Response(msg, { status: upstream.status });
        }

        const enc = new TextEncoder();
        const dec = new TextDecoder();
        let buf = "";
        const stream = upstream.body.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, ctrl) {
              buf += dec.decode(chunk, { stream: true });
              const frames = buf.split("\n\n");
              buf = frames.pop() ?? "";
              for (const f of frames) {
                const line = f.split("\n").find((l) => l.startsWith("data:"));
                if (!line) continue;
                try {
                  const ev = JSON.parse(line.slice(5).trim());
                  if (ev.type === "response.output_text.delta" && ev.delta) ctrl.enqueue(enc.encode(ev.delta));
                  if (ev.type === "response.refusal.delta" && ev.delta) ctrl.enqueue(enc.encode(ev.delta));
                } catch { /* ignore partial */ }
              }
            },
          }),
        );
        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
      },
    },
  },
});
