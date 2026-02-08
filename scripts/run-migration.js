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

async function runMigration() {
  let client;

  try {
    // Determine connection string
    let connectionString = process.env.SUPABASE_DB_URL;

    if (!connectionString) {
      // Build from individual components
      const host = process.env.SUPABASE_DB_HOST;
      const port = process.env.SUPABASE_DB_PORT || 5432;
      const database = process.env.SUPABASE_DB_NAME || 'postgres';
      const user = process.env.SUPABASE_DB_USER || 'postgres';
      const password = process.env.SUPABASE_DB_PASSWORD;

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

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📋 Running migration...');

    // Execute migration
    await client.query(migrationSql);
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
