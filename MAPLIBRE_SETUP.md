# MapLibre Vector Maps Setup Guide

This project uses **MapLibre GL** to display vector maps from MBTiles files. Vector tiles provide smooth, customizable maps with better performance than raster tiles.

## 📦 Installed Dependencies

The following packages are now installed for vector map support:

- **maplibre-gl** (^5.18.0) - Core mapping library
- **@mapbox/mbtiles** - MBTiles file reader
- **pmtiles** - Modern protocol buffer tiles format
- **protobufjs** - Protocol buffer parsing
- **@mapbox/vector-tile** - Vector tile parsing
- **pbf** - Protocol buffer utilities

## 🗺️ What You Need

### 1. MBTiles File with Vector Tiles

You need an `.mbtiles` file containing vector tiles for your region (Bangalore, India recommended).

**Expected filename:** `osm-2020-02-10-v3.11_india_bengaluru.mbtiles`

Or set a custom filename using the `MBTILES_FILENAME` environment variable in your `.env.local`:

```env
MBTILES_FILENAME=your-custom-map.mbtiles
```

### 2. Where to Get MBTiles Files

#### Option A: Download Pre-made Tiles (Recommended)
- **MapTiler**: https://data.maptiler.com/downloads/asia/india/karnataka/
  - Download Bangalore/Karnataka vector tiles
  - Free for development use

- **OpenMapTiles**: https://openmaptiles.org/downloads/
  - Download India extract or Bangalore region
  - Includes POIs, roads, buildings, etc.

- **Protomaps**: https://protomaps.com/downloads
  - Modern PMTiles format (also supported)

#### Option B: Create Your Own
Use `tilemaker` or `tippecanoe` to create custom MBTiles from OSM data:

```bash
# Install tilemaker
# Download Bangalore OSM data from https://download.geofabrik.de/asia/india.html

# Create MBTiles
tilemaker --input india-latest.osm.pbf --output bangalore.mbtiles \\
  --bbox 77.3,12.7,77.9,13.2 --process resources/process-openmaptiles.lua
```

## 📥 Setup Instructions

### Step 1: Place Your MBTiles File

Copy your `.mbtiles` file to the project root directory:

```
KJU-2026/
├── your-map.mbtiles          ← Place file here
├── src/
├── public/
└── package.json
```

### Step 2: Verify the File

Run the verification script to check your MBTiles file:

```bash
node scripts/check-mbtiles.js
```

This will show:
- ✅ File size and location
- 📋 Metadata (name, format, bounds)
- 🗺️ Tile count and zoom levels
- ✓ Compression status (should be gzipped for vector tiles)

### Step 3: Update Configuration (if needed)

If your file has a different name, either:

**A. Rename the file:**
```bash
mv your-map.mbtiles osm-2020-02-10-v3.11_india_bengaluru.mbtiles
```

**B. Or update `.env.local`:**
```env
MBTILES_FILENAME=your-map.mbtiles
```

**C. Or edit `src/lib/db/tilesDb.ts`:**
```typescript
const FILENAME = 'your-custom-name.mbtiles';
```

### Step 4: Start the Development Server

```bash
npm run dev
```

The map should now load on:
- Main map view: http://localhost:3000/dashboard/map
- Dashboard: http://localhost:3000/dashboard

## 🎨 Map Customization

### Modify Map Style

Edit `src/components/visualization/RealTrafficMap.tsx` to customize:

- **Colors**: Update layer paint properties
- **Fonts**: Configure text rendering
- **Features**: Show/hide roads, buildings, water, etc.
- **Traffic overlay**: Customize congestion visualization

### Current Map Features

The map includes:
- ✅ Vector base layer from MBTiles
- ✅ Traffic congestion overlay (color-coded roads)
- ✅ Vehicle markers (trucks, cars, vans)
- ✅ Incident markers (accidents, construction)
- ✅ Fuel station markers
- ✅ Zone boundaries with congestion heat maps
- ✅ Real-time vehicle tracking and movement

## 🔧 Troubleshooting

### "MBTiles file NOT FOUND" Error

**Solution:** Place your `.mbtiles` file in the project root or update the configuration.

### Tiles Not Displaying

1. Check browser console for errors
2. Verify tile API endpoint: http://localhost:3000/api/tiles/11/1464/1097
3. Should return binary data with `Content-Type: application/vnd.mapbox-vector-tile`

### Performance Issues

- **Reduce zoom levels**: Edit zoom constraints in map initialization
- **Tile caching**: Enable browser caching (already configured)
- **Smaller region**: Use a smaller geographic area in your MBTiles

### Blank Map

- Check that tiles are **vector tiles** (not raster/PNG)
- Verify gzip compression: `node scripts/check-mbtiles.js`
- Ensure map style references correct source layers

## 📚 Additional Resources

- **MapLibre GL Docs**: https://maplibre.org/maplibre-gl-js/docs/
- **Vector Tile Spec**: https://github.com/mapbox/vector-tile-spec
- **MBTiles Spec**: https://github.com/mapbox/mbtiles-spec
- **OpenMapTiles Schema**: https://openmaptiles.org/schema/

## 💡 Alternative: Use Free Tile CDN

If you don't want to host tiles locally, you can use a free tile server:

**Edit `src/components/visualization/RealTrafficMap.tsx`:**

```typescript
sources: {
  'basemap': {
    type: 'vector',
    tiles: ['https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.pbf'],
    // Or use MapTiler: https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=YOUR_KEY
  }
}
```

**Note:** CDN options may have rate limits and require API keys for production use.

## ✅ Verification Checklist

- [ ] MBTiles file in project root
- [ ] File is readable: `node scripts/check-mbtiles.js`
- [ ] MapLibre GL JS installed (`maplibre-gl` in package.json)
- [ ] Map displays on `/dashboard/map`
- [ ] Tiles load without errors in browser console
- [ ] Vehicle markers appear on map
- [ ] Traffic overlay shows colored roads

---

**Need help?** Check the error logs in the browser console and terminal for specific issues.


