#!/usr/bin/env -S node --loader tsx
import { neon } from "@neondatabase/serverless";
import fs from "node:fs/promises";
const sql = neon(process.env.NEON_DATABASE_URL!);

async function run() {
  const drivers = JSON.parse(await fs.readFile("apps/web/data/drivers.json", "utf8"));
  for (const d of drivers) {
    await sql`insert into drivers(id, code, name, constructor)
              values (${d.id}, ${d.code}, ${d.name}, ${d.constructor})
              on conflict (id) do update set code=excluded.code`;
  }
  const races = JSON.parse(await fs.readFile("apps/web/data/races.json", "utf8"));
  for (const r of races) {
    await sql`insert into races(id, season, round, name, circuit, date, country)
              values (${r.id}, ${r.season}, ${r.round}, ${r.name}, ${r.circuit}, ${r.date}, ${r.country})
              on conflict (id) do nothing`;
  }
  console.log("Seeded drivers and races.");
}
run();