/**
 * Health check (GET /api/health)
 * Minimal heartbeat used by uptime checks.
 */
export async function GET() {
    return Response.json({ ok: true, ts: Date.now()});
}