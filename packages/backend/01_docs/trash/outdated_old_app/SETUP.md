# Setup & Run — residence-backend-v2

This document explains how to set up the project locally for development.

Prerequisites
- Node.js (v18+ recommended)
- npm (or yarn)
- MySQL server
- `sequelize-cli` (globally or via npx)

Recommended: create a `.env` file in the project root with required environment variables. Example minimal values (replace with real credentials):

```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=residence_db
DB_USER=root
DB_PASS=pass
AUTH_ACCESS_TOKEN_SECRET=your_access_secret
AUTH_ACCESS_TOKEN_EXPIRY=1h
AUTH_REFRESH_TOKEN_SECRET=your_refresh_secret
AUTH_REFRESH_TOKEN_EXPIRY=7d
RESET_PASSWORD_TOKEN_EXPIRY_MINS=10
# Payment provider keys, email SMTP, firebase, etc.
```

Install dependencies

```powershell
npm install
```

Database setup
- Create the database in MySQL.
- Run migrations:

```powershell
npx sequelize-cli db:migrate
```

- Optionally run seeders:

```powershell
npx sequelize-cli db:seed:all
```

Start the app

```powershell
npm run dev
# or
npm start
```

Notes
- Static uploads are served from the `uploads/` folder; ensure the folder exists and permissions allow file writes.
- Cron jobs will start when the server starts; if you want to run them separately, modify `utils/crons` to expose job scheduling.

Troubleshooting
- If the server fails on missing env vars, add the required variables to `.env` and restart.
- To enable detailed request logs in development, set `NODE_ENV=development`.

