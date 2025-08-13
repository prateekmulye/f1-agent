import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import type { AIMessageChunk } from "@langchain/core/messages";

const State = Annotation.Root({
  question: Annotation<string>(),
  output: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
});
type GraphState = typeof State.State;

const model = new ChatGroq({
  model: "llama-3.1-8b-instant",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.2,
});


function chunkToText(chunk: AIMessageChunk): string {
  const c = chunk.content;
  if (typeof c === "string") return c;

  for (const part of c as Array<{ type: string; text?: string }>) {
    if (part.type === "text" && typeof part.text === "string") {
      return part.text;
    }
  }
  return "";
}

async function respond(state: GraphState) {
  const sys =
    "You are a concise F1 analyst. Keep answers short. If you cite a stat, mention the source briefly.";
  let final = "";
  const tokenStream = await model.stream([
    { role: "system", content: sys },
    { role: "user", content: state.question },
  ]);
  for await (const chunk of tokenStream) {
    final += chunkToText(chunk);
  }
  return { ...state, output: final };
}

const app = new StateGraph(State)
  .addNode("respond", respond)
  .addEdge(START, "respond")
  .addEdge("respond", END)
  .compile();

type ChatModelStreamEvent = {
  event: "on_chat_model_stream";
  data: { chunk: AIMessageChunk };
  name?: string;
};
type ChainEndEvent = {
  event: "on_chain_end";
  name?: string;
  data?: Record<string, unknown>;
};
type StreamEv = ChatModelStreamEvent | ChainEndEvent | { event: string; name?: string };

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const encoder = new TextEncoder();
  const cfg = { configurable: { thread_id: crypto.randomUUID() } };

  const events = await app.streamEvents(
    { question: query },
    { version: "v2", ...cfg }
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const evUnk of events) {
        const ev = evUnk as StreamEv;

        if (ev.event === "on_chat_model_stream" && "data" in ev && ev.data && "chunk" in ev.data) {
          const txt = chunkToText(ev.data.chunk);
          if (txt) controller.enqueue(encoder.encode(txt));
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}