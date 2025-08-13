import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { StateGraph, START, END } from "@langchain/langgraph";

type S = { question: string; answer?: string };

const model = new ChatGroq({
    model: "llama-3.1-8b-instant",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
});

const answerNode = async (state: S): Promise<S> => {
    const sys = `You are a Formula 1 Sport (F1) expert. Keep answers short and to the point. If you cite a stat, say where it came from.`;
    const res = await model.invoke([
        { role: "system", content: sys },
        { role: "user", content: state.question }
    ]);
    return {
        question: state.question,
        answer: String(res.content)
    };
};

const graph = new StateGraph<S>({ channels: { question: null, answer: null } })
  .addNode("answer", answerNode)
  .addEdge(START, "answer")
  .addEdge("answer", END)
  .compile();

export async function POST(req: NextRequest) {
    const { query } = await req.json();
    const encoder = new TextEncoder();
    const stream = await graph.stream(
        {question: query},
        {
            configurable: {
                thread_id: crypto.randomUUID()
            }
        }
    );

    return new Response(new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                const text = typeof chunk === "string" ? chunk : JSON.stringify(chunk) + "\n";
                controller.enqueue(encoder.encode(text));
            }
            controller.close();
        }
    }), {
        headers: {
            "Content-Type": "text/plain; cjarset=utf-8",
        }
    })
}