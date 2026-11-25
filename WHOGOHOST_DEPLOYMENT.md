# NexFieldForce on WhoGoHost DirectAdmin

This deployment runs NexFieldForce as one Node.js application with its React frontend, Express API, and MySQL database. It is not a static upload and must not be placed directly in `public_html`.

The DirectAdmin address `https://da44.host-ww.net:2222/evo/` is the WhoGoHost/GO54 panel used by the existing `eedgewforce.com.ng` account. That existing site is separate. Use a NexFieldForce domain or an explicitly chosen subdomain and do not extract this package over `eedgewforce.com.ng` unless replacing that live application is intentional.

## 1. Confirm Node.js support

1. Sign in to DirectAdmin.
2. Open `Menu` and search for `Setup Node.js App`, `Node.js Selector`, or `Node.js Applications`.
3. Select Node.js `22.x` (the project supports Node 20 through 22).
4. If no Node.js application tool is available, ask WhoGoHost to enable Node.js/Passenger for the target domain. PHP-only hosting cannot run `server.js`.

## 2. Create the MySQL database

1. Open `Databases` in DirectAdmin.
2. Create a dedicated database and database user for NexFieldForce.
3. Grant that user all privileges for the new database.
4. Open `phpMyAdmin`, select the new database, then choose `Import`.
5. Import `mysql-schema.sql` from the deployment package.
6. Do not import sample data, local `.env` files, or the database of `eedgewforce.com.ng`.

## 3. Upload the package

1. Create a private application directory, for example `/home/ACCOUNT/nexfieldforce`, outside `public_html`.
2. Upload `release/nexfieldforce-whogohost-mysql-production.zip` to that directory.
3. Extract it there.
4. Confirm `package.json`, `server.js`, `app.cjs`, `mysql-schema.sql`, `src/`, `server/`, and `dist/` are directly inside the app directory.

## 4. Configure the Node.js application

Use these values in DirectAdmin:

| Field | Value |
| --- | --- |
| Node.js version | `22.x` |
| Application mode | `Production` |
| Application root | `/home/ACCOUNT/nexfieldforce` |
| Application URL | `https://your-nexfield-domain.example/` |
| Startup file | `app.cjs` |
| Start command | `npm start` |
| Build command | `npm install && npm run build` |

Run `npm install` from the Node.js application tool after extracting the package. Do not upload `node_modules` from Windows.

## 5. Set private environment variables

Add these through the Node.js application environment screen or in a private `.env` file in the application directory. Never add them to frontend `VITE_*` variables.

```dotenv
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-nexfield-domain.example
VITE_API_BASE_URL=https://your-nexfield-domain.example
JWT_SECRET=replace_with_a_unique_64_byte_secret

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_directadmin_database_user
DB_PASSWORD=your_directadmin_database_password
DB_NAME=your_directadmin_database_name
REQUIRE_MYSQL_DATABASE=true

DB_SEED_ON_START=true
BOOTSTRAP_ADMIN_EMAIL=admin@nexfieldforce.com
BOOTSTRAP_ADMIN_PASSWORD=replace_with_a_unique_password_of_14_or_more_characters
UPLOAD_DIR=uploads
```

Set `DB_SEED_ON_START=false` after the first successful start. Keep the bootstrap password in a password manager and change it immediately after first sign-in.

## 6. Start and verify

1. Save the environment variables and restart the Node.js application.
2. Open `https://your-nexfield-domain.example/api/health` and confirm JSON is returned.
3. Open the main domain and sign in using the bootstrap email and password configured above.
4. Create an agent, assign a route, test attendance, then confirm the record appears in the admin dashboard.
5. Test one password-reset email after configuring SMTP or your chosen transactional email provider.

## Security checklist

- Keep the application directory outside `public_html`.
- Never upload `.env`, local uploads, or `node_modules` from this computer.
- Use a unique database password and JWT secret.
- Use HTTPS before testing GPS, camera, or background location permissions.
- Create individual user accounts; do not use a shared staff password.
- Back up the NexFieldForce database before upgrades and verify `/api/health` after every restart.
