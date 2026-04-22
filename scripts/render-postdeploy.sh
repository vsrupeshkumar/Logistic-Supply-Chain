#!/bin/bash
set -e

echo "🚀 Trafficmaxxers - Post Deploy Initialization"
echo "================================================"

DB_PATH="${DATABASE_PATH:-/var/data/trafficmaxxers.db}"

echo "📁 Database path: $DB_PATH"
echo "📁 Data directory: $(dirname $DB_PATH)"

# Create data directory if needed
mkdir -p "$(dirname $DB_PATH)"
echo "✅ Data directory ready"

# Run database initialization
echo "🗄️  Initializing database schema..."
node -e "
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');

  const db = new Database('$DB_PATH');
  db.pragma('journal_mode = WAL');

  // Read and execute schema SQL
  const schemaPath = path.join(process.cwd(), 'src/lib/db/schema-sqlite.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✅ Schema created');
  }

  // Read and execute seed SQL
  const seedPath = path.join(process.cwd(), 'src/lib/db/seed-sqlite.sql');
  if (fs.existsSync(seedPath)) {
    const seed = fs.readFileSync(seedPath, 'utf8');
    db.exec(seed);
    console.log('✅ Seed data loaded (12 Bangalore zones, 6 fuel stations)');
  }

  db.close();
  console.log('🎉 Database initialization complete!');
"

echo ""
echo "✅ Render deployment initialization complete!"
echo "🌍 Your app is live at your Render URL"
