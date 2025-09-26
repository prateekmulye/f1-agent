/**
 * Agent API (POST /api/agent)
 *
 * Overview
 * - Advanced F1 expert using Groq Llama 3.3 70B with two tools: get_prediction and run_eval.
 * - Enhanced with 2025 season knowledge and improved reasoning capabilities.
 * - Answers general questions directly; invokes tools only for predictions/evals.
 * - Normalizes free-form inputs (e.g., "Lando Norris", "British GP 2024") to internal ids.
 *
 * Approach
 * - Small, dependency-free normalization via bundled JSON lists of drivers and races.
 * - Strict tool discipline both by instruction and code: filter unknown tool names.
 * - Clear errors from underlying APIs are surfaced back to the model.
 */
import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import type { BaseMessageLike } from "@langchain/core/messages";
import { ToolMessage } from "@langchain/core/messages";
import { readFileSync } from 'fs';
import { join } from 'path';

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

type DriverRec = { id: string; code: string; name: string };
type RaceRec = { id: string; name: string };

// Load data dynamically
const loadDriversData = (): DriverRec[] => {
  try {
    const filePath = join(process.cwd(), 'data/drivers.json');
    const fileContents = readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return [];
  }
};

const loadRacesData = (): RaceRec[] => {
  try {
    const filePath = join(process.cwd(), 'data/races.json');
    const fileContents = readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return [];
  }
};

const DRIVERS: DriverRec[] = loadDriversData();
const RACES: RaceRec[] = loadRacesData();

function clean(text: string) {
  // strip punctuation and smart quotes, keep letters/numbers/underscores
  return text
    .normalize("NFKD")
    .replace(/[’'`”“]/g, "")
    .replace(/[^a-z0-9_\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDriverId(input?: string | null): string | undefined {
  if (!input) return undefined;
  const s = clean(String(input)).trim();
  if (!s) return undefined;
  // If it's already a code like NOR
  const byCode = DRIVERS.find((d) => d.code.toLowerCase() === s.toLowerCase());
  if (byCode) return byCode.code;
  // Try match by name last token or full name
  const lower = s.toLowerCase();
  const tokens = lower.split(/\s+/);
  const last = tokens[tokens.length - 1];
  const byName = DRIVERS.find((d) =>
    d.name.toLowerCase() === lower ||
    d.name.toLowerCase().includes(lower) ||
    d.name.toLowerCase().includes(last)
  );
  return byName?.code;
}

function normalizeRaceId(input?: string | null): string | undefined {
  if (!input) return undefined;
  const s = clean(String(input)).trim();
  if (!s) return undefined;
  // If already an id like 2024_gbr or 2025_singapore
  if (/^\d{4}_[a-z]+$/i.test(s)) return s;
  const lower = s.toLowerCase();
  // Remove year tokens and words like grand prix
  const cleaned = lower.replace(/\b(19|20)\d{2}\b/g, "").replace(/grand\s+prix|gp/g, "").trim();
  const byName = RACES.find((r) => r.name.toLowerCase().includes(cleaned));
  return byName?.id;
}

const getPrediction = tool(
  async (input: unknown) => {
    const { race_id, driver_id } = input as { race_id?: string; driver_id?: string };
    const rid = normalizeRaceId(race_id) || race_id;
    const did = normalizeDriverId(driver_id) || driver_id;
    if (!rid) {
      const available = RACES.map((r) => r.id).join(", ");
      return `race_id is required. Available races: ${available}`;
    }
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const url = new URL("/api/predict", base);
    url.searchParams.set("race_id", rid);
    if (did) url.searchParams.set("driver_id", did);
    const r = await fetch(url.toString(), { cache: "no-store" });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return `Prediction request failed (${r.status}). ${body || ""}`.trim();
    }
    return await r.text();
  },
  {
    name: "get_prediction",
    description: "Get probability of scoring points for a driver in a race",
    schema: z.object({ race_id: z.string().optional(), driver_id: z.string().optional() }),
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
  model: "llama-3.3-70b-versatile",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.2,
}).bindTools(tools);

// ---------- Node: tool-call loop ----------
async function respond(state: GraphState) {
  const sys = [
    "You are an Formula 1 (F1) expert with comprehensive knowledge of the 2025 season.",
    "Current context: It's September 2025. The 2025 F1 season is well underway with regulatory changes and driver lineup updates.",
    "For general questions about F1 news, standings, regulations, or season updates, answer directly using your knowledge.",
    "When users ask about odds/probability/chance/likelihood/% for a driver and a race, CALL the get_prediction tool.",
    "Map natural inputs to: race_id like 2025_singapore (for 2025 races) or 2024_gbr (for historical), and driver_id like LEC, NOR, VER.",
    "Stay current with 2025 championship standings, driver transfers, team performance, and regulatory changes.",
    "If either id is missing or ambiguous for predictions, ask ONE concise clarifying question then call the tool.",
    "Available tools: get_prediction, run_eval. Do not invent other tools (e.g., search).",
    "Keep answers concise, factual, and cite data sources briefly (OpenF1 for live signals, official F1 sources for standings).",
  ].join(" ");
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

  const calls = (ai.tool_calls ?? []).filter((c: any) => c && (c.name === "get_prediction" || c.name === "run_eval"));
    if (calls.length === 0) {
      // final answer
      return { ...state, output: String(ai.content) };
    }
    for (const call of calls) {
      const toolFn = tools.find((t) => t.name === call.name);
      if (!toolFn) continue;
      const cfg = { toolCall: { id: String(call.id), name: String(call.name || "tool") } };
      const toolOut = await (toolFn as { invoke: (args: Record<string, unknown>, config: { toolCall: { id: string; name: string } }) => Promise<unknown> }).invoke(call.args, cfg);
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
  let body: { query?: string };
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
