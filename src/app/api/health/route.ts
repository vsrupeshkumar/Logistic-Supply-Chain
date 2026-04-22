export async function GET() {
  const dbPath = process.env.DATABASE_PATH || 'trafficmaxxers.db';
  const dbFileName = dbPath.split('/').pop() || dbPath.split('\\').pop() || 'unknown.db';
  
  return Response.json({
    status: "ok",
    service: "trafficmaxxers",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbFileName
  });
}
