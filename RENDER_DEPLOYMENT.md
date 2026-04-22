# Deploying Trafficmaxxers to Render

## Prerequisites
- Render account at render.com (free)
- Repository: github.com/Anbu-00001/Logistic-supplychain (must be PUBLIC)
- API Keys ready: OPENROUTER_API_KEY and OPENWEATHER_API_KEY

---

## Method 1: One-Click via render.yaml (Recommended)

render.yaml is already in this repo. Just click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

Then in the Render dashboard, set these secret values:
- OPENROUTER_API_KEY → your key from openrouter.ai
- OPENWEATHER_API_KEY → your key from openweathermap.org

---

## Method 2: Manual Setup

### Step 1 — Create Web Service
1. render.com → New → Web Service
2. Connect GitHub → select Anbu-00001/Logistic-supplychain
3. Settings:
   - Name: trafficmaxxers
   - Region: Singapore (closest to Bangalore)
   - Branch: main
   - Runtime: Docker
   - Dockerfile path: ./Dockerfile
   - Plan: Free

### Step 2 — Add Persistent Disk (CRITICAL — DO THIS BEFORE DEPLOY)
1. In your web service → Disks tab
2. Add Disk:
   - Name: trafficmaxxers-data
   - Mount Path: /var/data
   - Size: 1 GB
3. Click Save

⚠️ If you skip this step, SQLite data is lost on every deploy.

### Step 3 — Set Environment Variables
In Environment tab, add these key-value pairs:
| Key | Value |
|-----|-------|
| NODE_ENV | production |
| NEXT_TELEMETRY_DISABLED | 1 |
| DATABASE_PATH | /var/data/trafficmaxxers.db |
| USE_REAL_WEATHER | true |
| SIMULATION_SPEED | 1.0 |
| OPENROUTER_API_KEY | [YOUR KEY — mark as Secret] |
| OPENWEATHER_API_KEY | [YOUR KEY — mark as Secret] |

### Step 4 — Deploy
Click "Create Web Service". Build takes 3-5 minutes.
Watch the Logs tab for: "✓ Build successful"

### Step 5 — Initialize Database (First time only)
1. In Render → your service → Shell tab
2. Run: `chmod +x scripts/render-postdeploy.sh`
3. Run: `./scripts/render-postdeploy.sh`
4. You should see: "🎉 Database initialization complete!"

### Step 6 — Verify
Your app is live at: https://trafficmaxxers.onrender.com
Health check: https://trafficmaxxers.onrender.com/api/health
Should return: `{"status":"ok","service":"trafficmaxxers",...}`

---

## Troubleshooting

### Build fails: "Error: node-pre-gyp install --fallback-to-build"
Cause: better-sqlite3 native bindings failed to compile.
Fix: Verify Dockerfile Stage 1 has:
  `RUN apk add --no-cache python3 make g++`
This MUST come before npm ci.

### Runtime error: "Cannot open database"
Cause: Disk not mounted or wrong DATABASE_PATH.
Fix:
1. Check Disks tab — /var/data must be mounted
2. Check env var DATABASE_PATH = /var/data/trafficmaxxers.db
3. Check Render logs for "[DB] Connecting to database at:"

### App loads but map is empty / vehicles don't work
Cause: Database exists but has no schema/seed data.
Fix: Run `./scripts/render-postdeploy.sh` from Shell tab again.

### "Module not found: better_sqlite3.node"
Cause: Docker image was built without native build tools.
Fix: Ensure both Stage 1 AND Stage 2 have:
  `RUN apk add --no-cache python3 make g++`
Alpine stages don't share installed packages.

### Service sleeping (free tier)
Render free tier sleeps after 15 min of inactivity.
First request after sleep takes ~30 seconds.
For demo: open the URL 2 minutes before judges arrive.
To prevent sleeping: upgrade to Render Starter ($7/mo)
or use UptimeRobot (free) to ping /api/health every 10 min.

### "next.config.ts: output standalone not set"
Fix: Ensure next.config.ts has `output: 'standalone'` set.
Without this, server.js won't exist and Docker CMD fails.

---

## Keep Service Awake During Demo (Important!)

Render free tier sleeps. Use this free workaround:
1. Go to uptimerobot.com (free account)
2. Create HTTP monitor pointing to:
   https://[your-app].onrender.com/api/health
3. Set interval: 10 minutes
4. This keeps the service warm during your presentation.


