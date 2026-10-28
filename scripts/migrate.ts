#!/usr/bin/env tsx
/**
 * scripts/migrate.ts
 *
 * Runs the initial SQL migration against the Supabase Postgres instance.
 * Reads credentials from .env.local:
 *   - NEXT_PUBLIC_SUPABASE_URL (for project ref)
 *   - SUPABASE_DB_PASSWORD
 */

import { Client } from "pg";
import fs from "fs";
import path from "path";

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!supabaseUrl || !dbPassword) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD in environment.");
  }

  // Extract project ref (e.g. ocuehqbjsyemeypmcloy from https://ocuehqbjsyemeypmcloy.supabase.co)
  const match = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!match) {
    throw new Error(`Unable to extract project ref from URL: ${supabaseUrl}`);
  }
  const projectRef = match[1];

  const migrationPath = path.resolve(__dirname, "../supabase/combined_migration.sql");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  console.log(`\n🐘 Connecting to Supabase database (${projectRef})...\n`);

  // Direct connection to Supabase Postgres
  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log("✅ Connected to Postgres database.");

    console.log("⏳ Executing combined migration...");
    await client.query(sql);
    console.log("✅ Migration executed successfully!");

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\n📋 Public tables verified in database:");
    res.rows.forEach((r) => console.log(`   - ${r.table_name}`));
    console.log("\n🚀 Database is ready!\n");
  } catch (err: unknown) {
    console.error("❌ Migration error:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
