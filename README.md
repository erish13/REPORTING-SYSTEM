# Reporting System

A web-based reporting system with:
- **Backend API** (Node.js / Express) for generating and serving reports
- **Reporting dashboard** (React + Vite) for viewing and interacting with reports

> Branch note: this repository has a branch named `feature/security-restrictions` which appears to focus on access control / restrictions.

---

## Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Running Locally](#installation--running-locally)
  - [1) Backend (API)](#1-backend-api)
  - [2) Frontend (Dashboard)](#2-frontend-dashboard)
- [Configuration (Environment Variables)](#configuration-environment-variables)
- [Using the System](#using-the-system)
- [API Testing](#api-testing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features
- View and run reports from a dashboard UI
- Backend routes/controllers for report-related endpoints
- Middleware layer for request handling (auth/security logic may live here)
- Report definitions located in the `reports/` folder

> Update this section as you finalize features (filters, export, scheduling, role restrictions, etc.).

---

## Project Structure

- `server.js` – backend entry point
- `routes/` – API routes
- `controllers/` – route handlers / controller logic
- `middleware/` – middleware (auth, restrictions, validation, etc.)
- `models/` – data models
- `reports/` – report logic/definitions
- `utils/` – shared utilities
- `reporting-dashboard/` – React + Vite frontend

---

## Prerequisites
- **Node.js** (LTS recommended)
- **npm** (comes with Node.js)

If your system requires a database, make sure it is installed and running and that your connection variables are set (see [Configuration](#configuration-environment-variables)).

---

## Installation & Running Locally

### 1) Backend (API)

From the repository root:

```bash
npm install
npm start
```

If you don’t have a `start` script configured, try:

```bash
node server.js
```

By default, the backend should start an HTTP server (check your console output for the exact port).

---

### 2) Frontend (Dashboard)

The frontend lives in `reporting-dashboard/`.

```bash
cd reporting-dashboard
npm install
npm run dev
```

Vite will print a local URL (commonly something like `http://localhost:5173`).

---

## Configuration (Environment Variables)

Create a `.env` file if your backend/frontend expects environment variables.

Common examples (rename to match your actual implementation):

### Backend `.env` (example)
```bash
PORT=3000
# DATABASE_URL=...
# JWT_SECRET=...
# CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env` (example)
In `reporting-dashboard/`:
```bash
VITE_API_BASE_URL=http://localhost:3000
```

> If you tell me what variables your project actually uses (or share your config files), I can rewrite this section to be exact.

---

## Using the System

1. Start the **backend** first.
2. Start the **frontend** dashboard.
3. Open the Vite URL in your browser.
4. Run reports from the dashboard UI.

If your system uses authentication/roles:
- Make sure you have a valid user account seeded/created.
- If you get an **Access Denied** response, your role may not have permission for that report/route.

---

## API Testing

A `test.http` file exists in the repository root. You can run it using:
- VS Code REST Client extension, or
- any HTTP client (Postman, Insomnia, curl)

Update the base URL/port inside `test.http` to match your backend server.

---

## Troubleshooting

**Frontend loads but no data appears**
- Confirm backend is running
- Confirm API base URL in the frontend environment (`VITE_API_BASE_URL`)
- Check browser devtools Network tab for failing requests

**CORS errors**
- Configure allowed origins in the backend (often `CORS_ORIGIN=http://localhost:5173`)

**Port already in use**
- Change `PORT` in `.env` or stop the process using the port

---

## License
Add your license here (MIT, Apache-2.0, proprietary, etc.).
