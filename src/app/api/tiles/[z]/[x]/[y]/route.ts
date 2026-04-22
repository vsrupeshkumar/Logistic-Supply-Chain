import { NextRequest, NextResponse } from 'next/server';
import { getTilesDb } from '@/lib/db/tilesDb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  // Tile endpoint is deprecated - using free OSM CDN tiles instead
  // Return 410 Gone status to indicate endpoint is no longer available
  return new NextResponse(
    JSON.stringify({ 
      error: 'Tile endpoint deprecated',
      message: 'Local tiles are no longer served. The application now uses free OpenStreetMap tiles from CDN.',
      action: 'Please refresh your browser (Ctrl+Shift+R or Cmd+Shift+R) to clear cache.',
      documentation: 'See MAPLIBRE_SETUP.md for information about setting up local MBTiles files.'
    }),
    { 
      status: 410, // Gone - indicates the resource is no longer available
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}
