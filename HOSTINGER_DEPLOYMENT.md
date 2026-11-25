# Hostinger Business Deployment

This project is prepared for Hostinger Business Web Hosting as a real Node.js Web App with:

- React / Vite frontend
- Node.js / Express backend
- Hostinger MySQL database
- `server.js` as the entry file

## Deploy mode

Use the full-stack Node.js deployment path, not plain static hosting.

Why:

- the frontend is a Vite React app
- the backend entrypoint is [`server.js`](C:\Users\HP\Documents\nexfeildforce\server.js)
- the backend serves the built frontend and exposes API routes such as:
  - `/api/health`
  - `/api/bootstrap`
  - `/api/executive-summary`
  - `/api/export/executive.csv`
  - `/api/export/routes.csv`

## Files to upload

Use the prepared archive [`nexfieldforce-hostinger-mysql-production-20261112.zip`](C:\Users\HP\Documents\nexfeildforce\release\nexfieldforce-hostinger-mysql-production-20261112.zip). It contains the complete Node.js application source and deliberately excludes local data, dependencies, and secrets.

If you build your own ZIP, include the whole project except these:

- `node_modules/`
- `.git/`
- `dist/` is optional

Recommended ZIP contents:

- `package.json`
- `package-lock.json`
- `server.js`
- `mysql-schema.sql`
- `vite.config.js`
- `postcss.config.js`
- `tailwind.config.js`
- `.env` values added through hPanel instead of uploading secrets
- `public/`
- `src/`
- `.env.example`

## Exact Hostinger setup

Follow these steps in order.

## Before you upload

The currently opened DirectAdmin account is for `edgewforce.com.ng`, not a NexFieldForce deployment. Its dashboard shows shared-hosting tools and does not show a Node.js application manager. Do not overwrite that existing website.

This Express application requires a hosting target that explicitly offers a Node.js application manager (Node `20.x` or `22.x`) and a MySQL database. In Hostinger hPanel, that is normally the `Advanced` -> `Node.js` section for the chosen site. If that section is absent, deploy this package to a Hostinger VPS/Cloud plan or ask Hostinger support to enable Node.js for the intended domain; PHP-only or static hosting cannot run `server.js`.

### 1. Log in to Hostinger

1. Open [https://hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Sign in to your Hostinger account
3. Open the website/project where you want NexFieldForce deployed

### 2. Prepare the Hostinger MySQL database

1. In hPanel, open `Databases` -> `MySQL Databases`.
2. Create a database and database user, then assign the user to that database with all privileges.
3. Open `phpMyAdmin` for the new database.
4. Choose `Import`, select [mysql-schema.sql](C:\Users\HP\Documents\nexfeildforce\mysql-schema.sql), then click `Import`.
5. Confirm the import completes without errors. It creates HR, field, sales, fleet, ERP/CRM, document governance, audit, and security tables.
6. Copy the exact database name, database username, and password to hPanel Node.js environment variables. For a database on the same Hostinger plan, use `DB_HOST=localhost` and `DB_PORT=3306`.

### 4. Create the Node.js Web App

1. In hPanel open `Websites`
2. Select your site
3. Open `Advanced`
4. Open `Node.js`
5. Click `Create application`
6. Choose Node.js version `20.x` or `22.x`
7. Set the application root to the uploaded project folder
8. Set the startup file to `server.js`

### 5. Connect GitHub or upload files

Option A: GitHub

1. Push this repository to GitHub
2. In Hostinger choose the Git deploy option if available for your panel flow
3. Connect your repository under your GitHub account
4. Select the correct branch

Option B: ZIP upload

1. Zip the project files listed above
2. Upload them into the app root folder using File Manager

### 6. Configure build and start

Use these exact settings:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Entry file: `server.js`
- Node version: `20.x` or `22.x`

If Hostinger still shows a missing Vite package during build, use:

- Build command: `npm install --include=dev && npm run build`

### 7. Add environment variables

In the Node.js app environment variables screen, add the values you already provided for:

- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `REQUIRE_MYSQL_DATABASE=true`
- `CORS_ORIGIN`
- `VITE_API_BASE_URL`
- `JWT_SECRET`
- `NODE_ENV`
- `PORT`
- `DB_SEED_ON_START`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `UPLOAD_DIR`
- `VITE_APP_MODE`

Do not upload `.env`. Add secrets only in the hPanel Node.js environment-variable screen. `NODE_ENV=production` belongs in hPanel, not in a Vite `.env` file, because Vite reserves that value for its own build mode.

### 8. Deploy

1. Save environment variables
2. Trigger deployment / restart the Node.js app
3. Wait for Hostinger to finish install, build, and boot

### 9. Test the deployment

1. Open `https://yourdomain.com/api/health`
2. Confirm it returns JSON
3. Open `https://yourdomain.com`
4. Test login
5. Test dashboard loading
6. Test client dashboard login
7. Test CSV export

## Initial login and role access

On the first successful start, the application creates one super-admin account only when `DB_SEED_ON_START=true` and both bootstrap variables are configured:

- Email: the value of `BOOTSTRAP_ADMIN_EMAIL` (recommended: `admin@nexfieldforce.com`)
- Password: the unique value you set for `BOOTSTRAP_ADMIN_PASSWORD`
- Role: `SUPER_ADMIN`

Sign in with that account, immediately change its password, and create or approve individual accounts from the Admin workspace. Do not create a shared password for agents, supervisors, drivers, finance users, or clients. Each person should register or be created with a distinct account so the audit trail, assigned tasks, attendance, customer access, and password reset history remain attributable.

Role access is enforced by the backend:

- `SUPER_ADMIN` and `ADMIN`: complete administration and reporting
- `HR_MANAGER`: staff, attendance, leave, onboarding, and HR operations
- `SUPERVISOR`: assigned teams, tasks, routes, and field oversight
- `FIELD_AGENT` and `SALES_AGENT`: assigned customers, routes, visits, attendance, and sales work
- `DRIVER`: assigned trips, inspection, proof of delivery, and vehicle telemetry
- `FINANCE`: orders, payments, expenses, commissions, and finance reports
- `CLIENT` and `VIEWER`: assigned read-only dashboards and exports

## Hostinger hPanel settings

Use these settings in the Node.js deployment form:

- Framework: `Other`
- Node.js version: `20.x` or `22.x`
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Entry file: `server.js`

This project also includes a root [`.npmrc`](C:\Users\HP\Documents\nexfeildforce\.npmrc) with `include=dev` so Hostinger installs Vite build tooling even when production environment variables are enabled.

## Environment variables to add in Hostinger

Add these in the Hostinger Node.js app Environment Variables screen:

```bash
VITE_APP_MODE=production
PORT=3000
CORS_ORIGIN=https://your-domain.com
DB_SEED_ON_START=true
BOOTSTRAP_ADMIN_EMAIL=admin@nexfieldforce.com
BOOTSTRAP_ADMIN_PASSWORD=use-a-unique-password-with-14-or-more-characters
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_mysql_database

VITE_MAPBOX_ACCESS_TOKEN=
VITE_API_BASE_URL=https://your-domain.com

VITE_ENABLE_OPENAI=false
VITE_OPENAI_API_BASE=https://api.openai.com/v1
VITE_OPENAI_API_KEY=
VITE_OPENAI_MODEL=gpt-4.1-mini

RESEND_API_KEY=
EMAIL_FROM=NexFieldForce <onboarding@resend.dev>
```

## Recommended deployment flow

### Option 1: GitHub deploy

1. Push this project to GitHub.
2. In Hostinger hPanel go to `Websites` -> `Add Website`.
3. Select `Node.js Apps`.
4. Choose `Import Git Repository`.
5. Pick your repository and branch.
6. Apply the build settings listed above.
7. Add environment variables.
8. Deploy.

## MySQL setup in Hostinger

If you keep the optional legacy MySQL fallback, Hostinger’s current guidance for Node.js + database connectivity is MySQL-based. Relevant official guides:

- [Connecting a Hostinger MySQL Database to a Node.js Application](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [How to Manage MySQL Databases in Hostinger](https://www.hostinger.com/support/1864454-how-to-manage-mysql-databases-in-hostinger)

Steps:

1. In hPanel go to `Databases` -> `MySQL Databases`
2. Create a new database, username, and password
3. Open phpMyAdmin for that database
4. Import [`mysql-schema.sql`](C:\Users\HP\Documents\nexfeildforce\mysql-schema.sql)
5. Add `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` to your Node.js app environment variables

If your Node.js app and MySQL database are on the same Hostinger account, `DB_HOST=localhost` is usually the correct value according to Hostinger’s guide.

### Option 2: ZIP upload

1. In hPanel, open `Websites`, choose the target domain, then open `Advanced` -> `Node.js`.
2. Create a Node.js app with Framework `Other`, Node `20.x` or `22.x`, application root `public_html` (or your chosen empty app directory), and startup file `server.js`.
3. Open `Files` -> `File Manager`, navigate to that exact application root, and upload `release/nexfieldforce-hostinger-mysql-production-20261112.zip`.
4. Extract the archive **in the application root**. Confirm `package.json`, `server.js`, `src/`, `server/`, and `mysql-schema.sql` sit directly in that folder, not inside an extra nested folder.
5. Return to the Node.js app panel. Set Build command to `npm install && npm run build` and Start command to `npm start`.
6. Add the environment variables from `HOSTINGER_ENV_TEMPLATE.txt`, replacing every placeholder. Set `CORS_ORIGIN` and `VITE_API_BASE_URL` to your actual `https://` domain, and set `REQUIRE_MYSQL_DATABASE=true`.
7. Save, then click `Deploy` or `Restart application`. Wait for the build log to show the server started.
8. Visit `/api/health`, then the main domain. Sign in using the one-time bootstrap administrator password you supplied, and change that password immediately.

## After deployment

Check these URLs:

- `https://your-domain.com/`
- `https://your-domain.com/api/health`

Expected `/api/health` response:

```json
{
  "ok": true,
  "success": true,
  "service": "NexFieldForce Unified Workforce, Commerce & Field Operations Platform"
}
```

## Important production notes

- In production mode, the server refuses to start unless `JWT_SECRET` is at least 48 characters and `CORS_ORIGIN` is explicitly set. If first-run seeding is enabled, it also refuses the old default bootstrap password.
- The primary live stack is `React + Node.js + Hostinger MySQL`.
- Firebase and Supabase are not used for production deployment on Hostinger.
- The database starts with one bootstrap super admin account and a clean starter dataset, not fake trips, orders, customers, or sample attendance.
- Do not expose sensitive AI secrets casually. Even though Hostinger environment variables are server-side for `server.js`, browser-side `VITE_*` values are still bundled into the frontend when referenced there.
- For high-security AI usage, move OpenAI calls fully server-side and stop using browser-side AI keys.
- Import `mysql-schema.sql` before using the ERP & CRM Operations workspace. The backend uses parameterized MySQL queries and tenant-scoped `company_id` records; never expose database credentials through `VITE_*` variables.
- If you deploy as a Node.js app in Hostinger, Hostinger manages routing for the server-side app. The included [`public/.htaccess`](C:\Users\HP\Documents\nexfeildforce\public\.htaccess) is mainly useful for static-style fallback cases.

## Current server behavior

The generated backend currently provides:

- health endpoint
- bootstrap endpoint for frontend state loading
- MySQL-backed account, registration, ERP/CRM, field, sales, and operational endpoints
- JWT login endpoint
- JWT current-session endpoint
- executive summary endpoint
- CSV export endpoints
- static serving of the built frontend

The frontend is now prepared to use the backend API instead of Firestore when `VITE_API_BASE_URL` is set.

That means your Hostinger Node.js backend + MySQL database are the complete production persistence layer.

## Exact files to upload

Upload these files and folders to the Node.js app root:

- `package.json`
- `package-lock.json`
- `server.js`
- `mysql-schema.sql`
- `vite.config.js`
- `postcss.config.js`
- `tailwind.config.js`
- `index.html`
- `public/`
- `src/`
- `server/`
- `.env.example`
- `HOSTINGER_ENV_TEMPLATE.txt`
- `README.md`
- `HOSTINGER_DEPLOYMENT.md`

Do not upload:

- `node_modules/`
- `.git/`
- local log files
- your local `.env`
