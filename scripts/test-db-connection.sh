#!/bin/bash

# Database Connection Test Script
# Tests connectivity to Supabase database before running migrations
# Usage: ./scripts/test-db-connection.sh

set -e

echo "🔍 Testing Supabase Database Connection..."
echo ""

# Get environment variables
DB_HOST=${SUPABASE_DB_HOST:-localhost}
DB_PORT=${SUPABASE_DB_PORT:-5432}
DB_NAME=${SUPABASE_DB_NAME:-pairwise}
DB_USER=${SUPABASE_DB_USER:-postgres}
DB_PASSWORD=${SUPABASE_DB_PASSWORD}
DB_URL=${SUPABASE_DB_URL}

# Validate inputs
if [ -z "$DB_URL" ] && [ -z "$DB_HOST" ]; then
  echo "❌ Error: Missing database configuration"
  echo ""
  echo "Provide either:"
  echo "  - SUPABASE_DB_URL=postgresql://user:pass@host:port/db"
  echo "  - SUPABASE_DB_HOST + SUPABASE_DB_USER + SUPABASE_DB_PASSWORD"
  exit 1
fi

if [ -z "$DB_PASSWORD" ] && [ -z "$DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_PASSWORD not set"
  exit 1
fi

# Display configuration (masked)
echo "📋 Configuration:"
if [ -n "$DB_URL" ]; then
  echo "   URL: $DB_URL (masked)"
else
  echo "   Host: $DB_HOST"
  echo "   Port: $DB_PORT"
  echo "   Database: $DB_NAME"
  echo "   User: $DB_USER"
  echo "   Password: ****"
fi
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "⚠️  PostgreSQL client (psql) not found"
  echo "   Install with:"
  echo "     - macOS: brew install postgresql"
  echo "     - Ubuntu: sudo apt-get install postgresql-client"
  echo "     - Using Docker: docker run -it --rm postgres:15 psql ..."
  echo ""
  echo "Attempting to test with Docker instead..."
  echo ""

  if ! command -v docker &> /dev/null; then
    echo "❌ Neither psql nor docker found. Cannot test connection."
    exit 1
  fi

  # Test with Docker
  echo "🐳 Testing via Docker..."
  if [ -n "$DB_URL" ]; then
    docker run --rm postgres:15 psql "$DB_URL" -c "SELECT 1 as connection_test" 2>/dev/null
  else
    PGPASSWORD="$DB_PASSWORD" docker run --rm postgres:15 psql \
      -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
      -c "SELECT 1 as connection_test" 2>/dev/null
  fi

  if [ $? -eq 0 ]; then
    echo "✅ Docker connection test passed"
    exit 0
  else
    echo "❌ Docker connection test failed"
    exit 1
  fi
fi

# Test with psql
echo "🔌 Testing connection..."
if [ -n "$DB_URL" ]; then
  psql "$DB_URL" -c "SELECT 1 as connection_test" > /dev/null 2>&1
else
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT 1 as connection_test" > /dev/null 2>&1
fi

if [ $? -eq 0 ]; then
  echo "✅ Connection successful!"
  echo ""

  # Get version and info
  echo "📊 Database Information:"
  if [ -n "$DB_URL" ]; then
    psql "$DB_URL" -c "SELECT version();" 2>/dev/null
  else
    PGPASSWORD="$DB_PASSWORD" psql \
      -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
      -c "SELECT version();" 2>/dev/null
  fi

  echo ""
  echo "✅ Ready to run migrations!"
  echo ""
  echo "Run migrations with:"
  if [ -n "$DB_URL" ]; then
    echo "  SUPABASE_DB_URL='$DB_URL' npm run migrate"
  else
    echo "  SUPABASE_DB_HOST=$DB_HOST \\"
    echo "  SUPABASE_DB_PORT=$DB_PORT \\"
    echo "  SUPABASE_DB_NAME=$DB_NAME \\"
    echo "  SUPABASE_DB_USER=$DB_USER \\"
    echo "  SUPABASE_DB_PASSWORD=*** \\"
    echo "  npm run migrate"
  fi

  exit 0
else
  echo "❌ Connection failed!"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Verify database is running"
  echo "  2. Check hostname/IP is correct"
  echo "  3. Confirm port is accessible"
  echo "  4. Verify username and password"
  echo "  5. Check firewall rules"
  echo ""
  echo "Test command:"
  if [ -n "$DB_URL" ]; then
    echo "  psql '$DB_URL'"
  else
    echo "  PGPASSWORD='***' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
  fi
  exit 1
fi
