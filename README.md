# CVRU Campus Surveillance System

React + Vite frontend with an Express/MongoDB backend for the Campus Surveillance System.

## Run locally

### 1. Backend

```bash
cd server
npm install
```

Create `server/.env` with your MongoDB connection, JWT secret, and server port. Keep secrets out of source control.

Then start the backend with your existing server command:

```bash
node server.js
```

### 2. Frontend

From the project root:

```bash
npm install
```

Copy `.env.example` to `.env` and set the API base URL, for example:

```env
VITE_API_URL=http://localhost:5000/api
```

Then:

```bash
npm run dev
```

## Current dashboard behavior

Dashboard operational values are not hardcoded. The authenticated dashboard requests `/api/automation/dashboard-summary` and refreshes every 5 seconds. Vehicle totals, vehicles currently inside, occupied parking, active alerts, recent activity, recent alerts, and last detection are derived from backend data.

Parking capacity is configured as 120 slots in the dashboard summary and parking UI.

## Final QA status

- Server JavaScript syntax: PASS
- Dashboard hardcoded sample operational values: none found
- Dashboard summary route: present and authenticated
- Frontend API references: use `VITE_API_URL`
- ZIP excludes `node_modules`, `dist`, and local secrets
- Vite production build was not executed in this packaged environment because the frontend dependency installation could not be completed here. Run `npm install` and `npm run build` locally before deployment.
