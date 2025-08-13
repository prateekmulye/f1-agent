import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

const State = Annotation.Root({
  question: Annotation<string>(),
  output: Annotation<string>(),
});
type GraphState = typeof State.State;

const model = new ChatGroq({
  model: "llama-3.1-8b-instant",
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.2,
});

async function respond(state: GraphState) {
    const sys = `You are a Formula 1 Sport (F1) expert. Keep answers short and to the point. If you cite a stat, say where it came from.`;
    let final = "";
    const tokenStream = await model.stream([
        { role: "system", content: sys },
        { role: "user", content: state.question },
    ]);

    for await (const chunk of tokenStream) {
    const piece =
      (typeof chunk === "string"
        ? chunk
        : (chunk as any)?.content?.[0]?.text ??
          (chunk as any)?.content ??
          "") as string;
    final += piece ?? "";
  }
  return { ...state, output: final };
}

const app = new StateGraph(State)
    .addNode("respond", respond)
    .addEdge(START, "respond")
    .addEdge("respond", END)
    .compile();

export async function POST(req: NextRequest) {
    const { query } = await req.json();
    const encoder = new TextEncoder();

    const cfg = { configurable: { thread_id: crypto.randomUUID() } };

    const events = await app.streamEvents({ question: query}, { version: "v2", ...cfg });

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            for await (const ev of events) {
                if (ev.event === "on_chat_model_stream") {
                    const data = (ev as any).data;
                    const txt =
                        data?.chunk?.content?.[0]?.text ??
                        data?.chunk?.text ??
                        data?.chunk ??
                        "";
                    if (txt) {
                        controller.enqueue(encoder.encode(txt));
                    }
                }
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8"
        },
    });
}