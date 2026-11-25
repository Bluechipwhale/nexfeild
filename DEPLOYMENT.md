# NexFieldForce — Production Deployment Guide

## 1. Hosting Options

### Option A: Hostinger Business Web Hosting (Node.js Application Manager)
1. **Upload Archive**: In Hostinger hPanel &rarr; File Manager, upload `nexfieldforce-production-hostinger.zip` to your application directory (e.g., `/home/u123456/public_html` or `/home/u123456/apps/nexfieldforce`).
2. **Extract Archive**: Extract all files in place.
3. **Node.js Manager Configuration**:
   * **Node.js Version**: `20.x` or `22.x`
   * **Application Mode**: `Production`
   * **Application Root**: `/home/u123456/apps/nexfieldforce`
   * **Application Startup File**: `server.js`
4. **Environment Variables**:
   * Copy contents of `.env.example` or `HOSTINGER_ENV_TEMPLATE.txt` to the Environment Variables section in hPanel.
   * Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (from Hostinger MySQL Databases) or Supabase credentials.
5. **Install & Run**:
   * Click **Install Dependencies** (`npm install --production`).
   * Click **Start Application**.

---

### Option B: Supabase Cloud Database Deployment
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard/project/lkzhtgvbjlwzvalgyram).
2. Go to **SQL Editor** &rarr; **New query**.
3. Open [`supabase-production-migration.sql`](file:///c:/Users/HP/Documents/nexfeildforce/supabase-production-migration.sql), copy the entire SQL script, and click **Run**.
4. All 40+ tables, foreign keys, indexes, triggers, and Row Level Security (RLS) policies will be deployed safely with zero data destruction.
5. In your server `.env`, configure:
   ```env
   SUPABASE_URL=https://lkzhtgvbjlwzvalgyram.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

---

## 2. Real-Time Map & Telemetry Integration
* **API Engine**: Free, open-source **Leaflet + OpenStreetMap API** integrated into the platform core.
* **No paid API keys required**: Completely free tiles from OpenStreetMap with zero rate limits or credit card requirements.
* **Features**: Live agent GPS telemetry, pulsing beacon animation, custom HTML merchant markers, and route paths.
