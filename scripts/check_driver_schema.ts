#!/usr/bin/env tsx

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL!);

async function checkDriverSchema() {
  try {
    console.log('🔍 Checking drivers table schema...');

    // Check column information
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'drivers'
      ORDER BY ordinal_position
    `;

    console.log('📋 Drivers table columns:');
    columns.forEach((col: any) => {
      console.log(`  • ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable}`);
    });

    // Sample some data
    console.log('\n📊 Sample driver records:');
    const sample = await sql`SELECT * FROM drivers LIMIT 5`;
    console.table(sample);

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

if (require.main === module) {
  checkDriverSchema();
}