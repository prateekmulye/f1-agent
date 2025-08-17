/**
 * Evals API (POST /api/evals/run)
 *
 * Runs the local evaluation script against the prediction API.
 * - In dev: executes via tsx loader from the monorepo root.
 * - In production/serverless: uses plain node; if process spawn is blocked, returns diagnostics.
 *
 * The route is intentionally narrow: shell out to the same script developers run locally
 * to keep behavior consistent between CLI and HTTP. We can refactor to a direct import later.
 */
import { NextRequest } from "next/server";
import { exec } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export async function POST(_req: NextRequest) {
  // Determine monorepo root so we can find scripts/run_eval.ts
  const appCwd = process.cwd();
  const repoRoot = path.resolve(appCwd, "..", "..");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // Prefer tsx in local/dev. In production serverless, spawning processes may be blocked.
  const useTsx = process.env.NODE_ENV !== "production";
  const cmd = useTsx
    ? `NEXT_PUBLIC_APP_URL=${appUrl} node --loader tsx scripts/run_eval.ts`
    : `NEXT_PUBLIC_APP_URL=${appUrl} node scripts/run_eval.ts`;

  const result = await new Promise<{ ok: boolean; out: string; err?: string }>((resolve) => {
    exec(cmd, { cwd: repoRoot, env: { ...process.env, NEXT_PUBLIC_APP_URL: appUrl } }, (err, stdout, stderr) => {
      resolve({ ok: !err, out: stdout.toString(), err: stderr.toString() || undefined });
    });
  });

  // If serverless blocked or script failed, return diagnostic info for the agent
  if (!result.ok) {
    const detail = [
      `Eval failed to run. This endpoint is primarily for local/dev.`,
      `cwd: ${repoRoot}`,
      `cmd: ${cmd}`,
      result.err ? `stderr: ${result.err.substring(0, 2000)}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");
    return new Response(detail, { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  return new Response(result.out || "Eval complete.", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
