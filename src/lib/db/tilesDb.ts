import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Singleton connection to MBTiles
// Configuration: Set your MBTiles filename here or via environment variable
const FILENAME = process.env.MBTILES_FILENAME || 'osm-2020-02-10-v3.11_india_bengaluru.mbtiles';
const MBTILES_PATH = path.join(process.cwd(), FILENAME);

const globalForTiles = globalThis as unknown as {
  tilesDb: Database.Database | undefined;
  tilesDbChecked?: boolean;
};

export function getTilesDb(): Database.Database | null {
  if (!globalForTiles.tilesDb) {
    
    if (!fs.existsSync(MBTILES_PATH)) {
        // Don't spam console - only log once
        if (!globalForTiles.tilesDbChecked) {
            console.log('⚠️  MBTiles file not found, using CDN tiles instead');
            console.log(`   Expected: ${MBTILES_PATH}`);
            console.log('   💡 Run "npm run check:mbtiles" for setup instructions');
            (globalForTiles as any).tilesDbChecked = true;
        }
        return null;
    }
    
    console.log('🗺️ Opening MBTiles database:', MBTILES_PATH);

    try {
        globalForTiles.tilesDb = new Database(MBTILES_PATH, { 
            readonly: true, 
            fileMustExist: true,
            timeout: 5000 
        });
        
        // Verify it's a valid MBTiles database
        const metadata = globalForTiles.tilesDb.prepare('SELECT count(*) as count FROM metadata').get() as { count: number };
        const tileCount = globalForTiles.tilesDb.prepare('SELECT count(*) as count FROM tiles').get() as { count: number };
        
        console.log(`✅ MBTiles database opened successfully`);
        console.log(`   📊 Metadata entries: ${metadata.count}`);
        console.log(`   🗺️  Total tiles: ${tileCount.count.toLocaleString()}`);
    } catch (e) {
        console.error('❌ Failed to open MBTiles:', e);
        throw e;
    }
  }
  return globalForTiles.tilesDb;
}
