/**
 * Database client (Neon serverless Postgres)
 * Usage: import { sql } and run sql`select ...` tagged templates.
 */
import { neon } from "@neondatabase/serverless";
export const sql = neon(process.env.NEON_DATABASE_URL!);