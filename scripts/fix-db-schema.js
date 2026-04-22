const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'trafficmaxxers.db');
console.log('📦 Fixing database schema...');
console.log('🔌 Database path:', dbPath);

try {
    const db = new Database(dbPath);
    
    // Check if columns exist
    const tableInfo = db.prepare("PRAGMA table_info(vehicles)").all();
    const hasCurrentRoute = tableInfo.some(col => col.name === 'current_route_json');
    const hasAlternativeRoute = tableInfo.some(col => col.name === 'alternative_route_json');
    
    if (!hasCurrentRoute) {
        console.log('➕ Adding current_route_json column...');
        db.prepare('ALTER TABLE vehicles ADD COLUMN current_route_json TEXT').run();
        console.log('✅ Added current_route_json column');
    } else {
        console.log('✓ current_route_json column already exists');
    }
    
    if (!hasAlternativeRoute) {
        console.log('➕ Adding alternative_route_json column...');
        db.prepare('ALTER TABLE vehicles ADD COLUMN alternative_route_json TEXT').run();
        console.log('✅ Added alternative_route_json column');
    } else {
        console.log('✓ alternative_route_json column already exists');
    }
    
    db.close();
    console.log('🎉 Database schema fixed successfully!');
} catch (error) {
    console.error('❌ Error fixing database schema:', error);
    process.exit(1);
}


