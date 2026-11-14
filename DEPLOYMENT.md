# Deploy the Library Management System for Free

This project can use **TiDB Cloud Starter** for a hosted MySQL-compatible database and **Render Free** for the Node website/API. TiDB Starter requires TLS and uses port `4000`. Its MySQL-compatible free quota is 5 GiB row storage and 50 million request units per month. When a quota is reached, new connections may be rejected until the quota resets. Render's free web service sleeps after 15 minutes without requests, so the first visit after a quiet period can take longer to load. These free plans are suitable for a student demo, not a production service.

References: [TiDB Starter quota and plan](https://docs.pingcap.com/tidbcloud/select-cluster-tier/?compatibility=mysql&plan=starter), [TiDB mysql2 setup and TLS](https://docs.pingcap.com/tidb/dev/dev-guide-sample-application-nodejs-mysql2/), [Render free service limits](https://render.com/docs/free).

## 1. Create the TiDB database

1. Create a free account at [TiDB Cloud](https://tidbcloud.com/), then create a **MySQL-compatible Starter** instance.
2. Create or generate the database password in the TiDB console. Do not share it or put it in source files.
3. In the instance's **Connect** panel, select the public endpoint and copy the host, port, username, and password. The Starter endpoint uses port `4000` and requires TLS.
4. Keep the database name as `library_management` for this project. If the console requires a database to be selected before connecting, create that database in its SQL editor first.

## 2. Apply the schema and sample records

From PowerShell, in the project folder, create `backend/.env` using `backend/.env.example` as a template. Set these values from TiDB's Connect panel:

```text
DB_HOST=<TiDB host>
DB_PORT=4000
DB_USER=<TiDB username>
DB_PASSWORD=<TiDB password>
DB_NAME=library_management
DB_SSL=true
APP_DB_USER=
APP_DB_PASSWORD=
```

Then run the setup once from the project folder:

```powershell
npm run init-db
```

This applies `database/schema.sql` and `database/seed.sql`. If TiDB denies the schema setup, use its SQL editor to create `library_management` and run the project schema and seed SQL there. Do not add admin credentials to Git or to Render.

Keep `APP_DB_USER` and `APP_DB_PASSWORD` blank for TiDB Starter. The setup script then uses your TiDB connection account for initialization; Render uses that same account for app queries.

## 3. Put the project in a GitHub repository

Render deploys from a connected Git provider. Create a **private** GitHub repository and upload the project folder. Make sure `.env` files and `node_modules` are excluded; `.gitignore` already excludes them. The repository should contain the `backend`, `frontend`, and `database` folders and the root `package.json`.

## 4. Deploy the web app on Render

1. Sign in to [Render](https://render.com/) and choose **New → Web Service**. Connect the private GitHub repository.
2. Set **Root Directory** to the repository root, **Build Command** to:

   ```text
   npm ci --prefix backend && npm ci --prefix frontend && npm run build:frontend
   ```

3. Set **Start Command** to:

   ```text
   npm run backend
   ```

4. Select the **Free** instance plan.
5. In the service's **Environment** settings, add:

   ```text
   NODE_ENV=production
   DB_HOST=<TiDB host>
   DB_PORT=4000
   DB_USER=<TiDB username>
   DB_PASSWORD=<TiDB password>
   DB_NAME=library_management
   DB_SSL=true
   APP_DEMO_USER=<choose a demo username>
   APP_DEMO_PASSWORD=<choose a long unique password>
   ```

   Add `PORT` only if Render asks; otherwise Render supplies it. Do not set `DB_SSL_CA` for Starter unless TiDB specifically tells you to use a CA certificate.
6. Click **Create Web Service** and wait for the build to finish. Render will show the public `onrender.com` address. Open it; the browser will ask for the demo username and password.

## 5. Confirm the database connection

Open `<your-render-address>/api/health`. A healthy response includes `"status":"healthy"` and a successful database connection. The health endpoint is intentionally available without the demo login so Render can monitor the service.

If deployment fails, check Render's deploy logs and confirm the TiDB host, username, password, database name, port `4000`, and `DB_SSL=true`. If the database reports a quota or access error, check TiDB's usage and access settings in its console.
