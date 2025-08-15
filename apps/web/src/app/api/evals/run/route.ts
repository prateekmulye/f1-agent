import { NextRequest } from "next/server";
import { exec } from "node:child_process";
export async function POST(_req: NextRequest) {
  const p = await new Promise<{ ok:boolean; out:string; err?:string }>(resolve => {
    exec(`NEXT_PUBLIC_APP_URL=${process.env.NEXT_PUBLIC_APP_URL || ("https://"+process.env.VERCEL_URL!)} node --loader tsx scripts/run_eval.ts`, { cwd: process.cwd() }, (err, stdout, stderr) => {
      resolve({ ok: !err, out: stdout.toString(), err: stderr.toString() || undefined });
    });
  });
  return Response.json(p, { status: p.ok ? 200 : 500 });
}
