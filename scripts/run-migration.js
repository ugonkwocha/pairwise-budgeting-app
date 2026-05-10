#!/usr/bin/env node

/**
 * Database Migration Script
 * Runs SQL migrations against Supabase PostgreSQL database
 *
 * Environment variables required:
 * - SUPABASE_DB_URL: PostgreSQL connection string
 * - OR individually:
 *   - SUPABASE_DB_HOST
 *   - SUPABASE_DB_PORT
 *   - SUPABASE_DB_NAME
 *   - SUPABASE_DB_USER
 *   - SUPABASE_DB_PASSWORD
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function cleanEnvValue(value) {
  return value?.trim().replace(/\\n/g, '');
}

async function runMigration() {
  let client;

  try {
    // Determine connection string
    let connectionString = cleanEnvValue(process.env.SUPABASE_DB_URL);

    if (!connectionString) {
      // Build from individual components
      const host = cleanEnvValue(process.env.SUPABASE_DB_HOST);
      const port = cleanEnvValue(process.env.SUPABASE_DB_PORT) || 5432;
      const database = cleanEnvValue(process.env.SUPABASE_DB_NAME) || 'postgres';
      const user = cleanEnvValue(process.env.SUPABASE_DB_USER) || 'postgres';
      const password = cleanEnvValue(process.env.SUPABASE_DB_PASSWORD);

      if (!host || !user || !password) {
        throw new Error(
          'Missing database connection details. Provide either SUPABASE_DB_URL or ' +
          'SUPABASE_DB_HOST, SUPABASE_DB_USER, and SUPABASE_DB_PASSWORD'
        );
      }

      connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    }

    console.log('🔗 Connecting to Supabase database...');

    client = new Client({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    await client.connect();
    console.log('✅ Connected successfully');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const migrationsDir = path.join(__dirname, '../supabase/migrations');

    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      throw new Error(`No SQL migrations found in ${migrationsDir}`);
    }

    console.log(`📋 Running ${migrationFiles.length} migration(s)...`);

    const hasExistingSchema = await client.query(`
      SELECT to_regclass('public.profiles') IS NOT NULL AS exists
    `);

    const appliedCount = await client.query('SELECT count(*)::int AS count FROM public.schema_migrations');
    const shouldBaselineExistingSchema = hasExistingSchema.rows[0]?.exists && appliedCount.rows[0]?.count === 0;

    if (shouldBaselineExistingSchema) {
      const baselineFiles = migrationFiles.filter((file) => file < '004_');
      for (const file of baselineFiles) {
        await client.query(
          'INSERT INTO public.schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
          [file]
        );
      }
      if (baselineFiles.length > 0) {
        console.log(`ℹ️  Baseline marked ${baselineFiles.length} existing migration(s) as applied`);
      }
    }

    for (const file of migrationFiles) {
      const alreadyApplied = await client.query(
        'SELECT 1 FROM public.schema_migrations WHERE filename = $1',
        [file]
      );

      if (alreadyApplied.rowCount > 0) {
        console.log(`⏭️  ${file} already applied`);
        continue;
      }

      const migrationPath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
      console.log(`➡️  ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(migrationSql);
        await client.query(
          'INSERT INTO public.schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log('✅ Migration completed successfully');

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

// Run migration
runMigration();
