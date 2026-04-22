/**
 * Test script to verify MBTiles file structure and compatibility
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Check for mbtiles files in project directory
const projectRoot = path.join(__dirname, '..');
const files = fs.readdirSync(projectRoot);
const mbtileFiles = files.filter(f => f.endsWith('.mbtiles'));

console.log('🔍 Scanning for MBTiles files...\n');

if (mbtileFiles.length === 0) {
    console.log('❌ No .mbtiles files found in project root!\n');
    console.log('📥 To use vector maps, you need an MBTiles file.');
    console.log('   Options:');
    console.log('   1. Download from: https://data.maptiler.com/');
    console.log('   2. Or create custom tiles: https://openmaptiles.org/downloads/planet/\n');
    console.log('   Place the .mbtiles file in:', projectRoot);
    console.log('\n💡 Expected filename: osm-2020-02-10-v3.11_india_bengaluru.mbtiles');
    console.log('   Or update FILENAME in src/lib/db/tilesDb.ts\n');
    process.exit(1);
}

console.log(`✅ Found ${mbtileFiles.length} MBTiles file(s):\n`);
mbtileFiles.forEach((file, i) => {
    console.log(`${i + 1}. ${file}`);
});
console.log();

// Analyze each file
mbtileFiles.forEach(filename => {
    console.log(`\n📦 Analyzing: ${filename}`);
    console.log('─'.repeat(60));
    
    const filepath = path.join(projectRoot, filename);
    const stats = fs.statSync(filepath);
    console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    try {
        const db = new Database(filepath, { readonly: true });
        
        // Get metadata
        console.log('\n📋 Metadata:');
        const metadata = db.prepare('SELECT name, value FROM metadata').all();
        metadata.forEach(({ name, value }) => {
            console.log(`   ${name}: ${value}`);
        });
        
        // Check tiles table
        const tileCount = db.prepare('SELECT COUNT(*) as count FROM tiles').get();
        console.log(`\n🗺️  Total tiles: ${tileCount.count.toLocaleString()}`);
        
        // Check zoom levels
        const zoomLevels = db.prepare('SELECT DISTINCT zoom_level FROM tiles ORDER BY zoom_level').all();
        console.log(`   Zoom levels: ${zoomLevels.map(z => z.zoom_level).join(', ')}`);
        
        // Sample tile
        const sampleTile = db.prepare('SELECT zoom_level, tile_column, tile_row, LENGTH(tile_data) as size FROM tiles LIMIT 1').get();
        if (sampleTile) {
            console.log(`   Sample tile: z${sampleTile.zoom_level}/x${sampleTile.tile_column}/y${sampleTile.tile_row} (${sampleTile.size} bytes)`);
        }
        
        // Check if tiles are gzipped (vector tiles usually are)
        const tileData = db.prepare('SELECT tile_data FROM tiles LIMIT 1').get();
        if (tileData && tileData.tile_data) {
            const isGzipped = tileData.tile_data[0] === 0x1f && tileData.tile_data[1] === 0x8b;
            console.log(`   Compression: ${isGzipped ? '✅ gzipped (vector tiles)' : '⚠️  not gzipped (raster tiles?)'}`);
        }
        
        db.close();
        console.log('\n✅ File is valid and readable!');
        
    } catch (error) {
        console.error(`\n❌ Error reading file: ${error.message}`);
    }
});

console.log('\n' + '─'.repeat(60));
console.log('✅ MBTiles scan complete!\n');
console.log('💡 To use a different file, update FILENAME in:');
console.log('   src/lib/db/tilesDb.ts\n');

