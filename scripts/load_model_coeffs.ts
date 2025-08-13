#!/usr/bin/env -S node --loader tsx
import { neon } from '@neondatabase/serverless';
import fs from "node:fs/promises";

const sql = neon(process.env.NEON_DATABASE_URL!);

async function main() {
    const raw = await fs.readFile("data/model.json", "utf-8");
    const items: { feature: string; weight: number }[] = JSON.parse(raw);
    await sql`delete from model_coeffs where model='baseline_v1'`;
    for (const it of items) {
        await sql`insert into model_coeffs(model, feature, weight) values ('baseline_v1', ${it.feature}, ${it.weight})`;
    }
    console.log("Loaded", items.length, "coefficients into model_coeffs (baseline_v1).");
}
main();