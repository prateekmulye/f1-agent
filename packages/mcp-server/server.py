import asyncio, os, json, asyncpg, aiohttp
from mcp.server.fastmcp import FastMCP

NEON = os.environ.get("NEON_DATABASE_URL")
APP = os.environ.get("APP_URL", "http://localhost:3000")
app = FastMCP("f1-mcp")

@app.tool()
async def f1_sql(query: str) -> str:
    """Run a read-only SQL SELECT against Neon (F1 schema)."""
    if not query.strip().lower().startswith("select"):
        return "Only SELECT queries are allowed."
    conn = await asyncpg.connect(NEON)
    rows = await conn.fetch(query)
    await conn.close()
    return json.dumps([dict(r) for r in rows])

@app.tool()
async def predict(race_id: str, driver_id: str) -> str:
    """Proxy to /api/predict."""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{APP}/api/predict?race_id={race_id}&driver_id={driver_id}") as r:
            return await r.text()

@app.tool()
async def last_eval() -> str:
    """Return the most recent eval run."""
    conn = await asyncpg.connect(NEON)
    row = await conn.fetchrow("select id, brier, logloss, created_at from eval_runs order by created_at desc limit 1")
    await conn.close()
    return json.dumps(dict(row) if row else {})

if __name__ == "__main__":
    app.run()