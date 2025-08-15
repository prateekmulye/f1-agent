import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import type { BaseMessageLike } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";

const buckets = new Map<string, { tokens: number; ts: number }>();
function allow(ip: string, rate = 30, perMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(ip) ?? { tokens: rate, ts: now };
  const refill = Math.floor(((now - b.ts) / perMs) * rate);
  b.tokens = Math.min(rate, b.tokens + refill);
  b.ts = now;
  if (b.tokens <= 0) return false;
  b.tokens -= 1;
  buckets.set(ip, b);
  return true;
}

const State = Annotation.Root({
  question: Annotation<string>(),
  output: Annotation<string>({ value: (_prev, next) => next, default: () => "" }),
});
type GraphState = typeof State.State;

const getPrediction = tool(
  async (input: unknown) => {
    const { race_id, driver_id } = input as { race_id: string; driver_id?: string };
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const url = new URL("/api/predict", base);
    url.searchParams.set("race_id", race_id);
    if (driver_id) url.searchParams.set("driver_id", driver_id);
    const r = await fetch(url.toString(), { cache: "no-store" });
    return await r.text();
  },
  {
    name: "get_prediction",
    description: "Get probability of scoring points for a driver in a race",
    schema: z.object({ race_id: z.string(), driver_id: z.string().optional() }),
  }
);

const runEval = tool(
  async () => {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const r = await fetch(new URL("/api/evals/run", base), { method: "POST" }).catch(() => null);
    if (!r || !r.ok)
      return "Eval route not available in this environment. Run scripts/run_eval.ts locally.";
    return await r.text();
  },
  {
    name: "run_eval",
    description: "Run a quick eval and return Brier/logloss (may take a few seconds)",
    schema: z.object({}),
  }
);

const tools = [getPrediction, runEval];

const model = new ChatGroq({
  model: "llama-3.1-8b-instant",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.2,
}).bindTools(tools);

// ---------- Node: tool-call loop ----------
async function respond(state: GraphState) {
  const sys = "You are an Formula 1 (F1) expert. Use tools when the user asks for predictions or metrics. Keep answers concise, factual, and cite data sources briefly (Jolpica/OpenF1).";
  const messages: BaseMessageLike[] = [
    { role: "system", content: sys },
    { role: "user", content: state.question },
  ];

  // small loop to satisfy multiple tool calls if needed
  for (let i = 0; i < 3; i++) {
    const ai = await model.invoke(messages, {
      tags: ["agent", "tools:get_prediction,run_eval"],
      metadata: { route: "api/agent" },
    });
    messages.push(ai);

    const calls = ai.tool_calls ?? [];
    if (calls.length === 0) {
      // final answer
      return { ...state, output: String(ai.content) };
    }
    for (const call of calls) {
      const toolFn = tools.find((t) => t.name === call.name);
      if (!toolFn) continue;
      const cfg = { toolCall: { id: String(call.id), name: String(call.name || "tool") } };
      const toolOut = await (toolFn as { invoke: (args: any, config: any) => Promise<any> }).invoke(call.args, cfg);
      const content = typeof toolOut === "string" ? toolOut : JSON.stringify(toolOut);
      messages.push(new ToolMessage({ content, name: String(call.name || "tool"), tool_call_id: String(call.id) }));
    }
  }
  return { ...state, output: "[Agent stopped after multiple tool calls]" };
}

// ---------- 5) Graph ----------
const app = new StateGraph(State)
  .addNode("respond", respond)
  .addEdge(START, "respond")
  .addEdge("respond", END)
  .compile();

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const query = body?.query;
  if (typeof query !== "string" || !query.trim()) {
    return new Response("Missing or invalid 'query' property", { status: 400 });
  }

  const xff = req.headers.get("x-forwarded-for");
  const ip = xff ? xff.split(",")[0].trim() : "local";
  if (!allow(ip)) return new Response("rate limited", { status: 429 });
  
  const res = await app.invoke(
    { question: query },
    { configurable: { thread_id: crypto.randomUUID() } }
  );
  const isStructured = typeof res.output === "object" && res.output !== null;
  return new Response(
    isStructured ? JSON.stringify(res.output) : String(res.output),
    {
      headers: {
        "Content-Type": isStructured
          ? "application/json; charset=utf-8"
          : "text/plain; charset=utf-8",
      },
    }
  );
}
