#!/usr/bin/env -S node --loader tsx
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.NEON_DATABASE_URL!);

async function checkDatabase() {
  console.log('=== Available Tables ===');
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.table(tables);

  console.log('\n=== Results Table Structure ===');
  const results = await sql`SELECT * FROM results LIMIT 3`;
  console.table(results);

  console.log('\n=== Sample Race Data ===');
  const races = await sql`SELECT id, name, season FROM races WHERE season = 2025 LIMIT 5`;
  console.table(races);

  console.log('\n=== Sample Driver Data ===');
  const drivers = await sql`SELECT id, name, constructor FROM drivers LIMIT 5`;
  console.table(drivers);
}

checkDatabase().catch(console.error);