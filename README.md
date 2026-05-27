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
✅ **User Authentication** – JWT-based login/logout with secure session management  
✅ **Role-Based Access Control** – Admin, Manager, and User roles with permission-based endpoints  
✅ **Archived Reports** – Soft delete functionality for maintaining historical data  
✅ **Report Generation** – Dynamic report generation with advanced filtering  
✅ **Password Reset** – Email-based password reset with token expiration  
✅ **Record Management** – Full CRUD operations with filtering and pagination  
✅ **Responsive Dashboard** – Modern React UI with real-time data updates  
✅ **Comprehensive Error Handling** – Global middleware error handling  
✅ **CORS Support** – Multi-origin request support

---

## Project Structure

```
REPORTING-SYSTEM/
├── server.js                       # Express server entry point
├── package.json                    # Backend dependencies
├── .env                           # Environment variables (DO NOT COMMIT)
├── config/
│   └── db.js                      # MySQL connection
├── routes/
│   ├── auth.js                    # Authentication endpoints
│   ├── records.js                 # Record management
│   └── reports.js                 # Report generation
├── controllers/
│   ├── recordController.js         # Record business logic
│   └── reportController.js         # Report generation logic
├── middleware/
│   ├── auth.js                    # JWT verification
│   ├── authorize.js               # Role-based authorization
│   └── errorHandler.js            # Global error handling
├── models/
│   └── Record.js                  # Data model
├── utils/
│   ├── dateUtils.js               # Date utilities
│   ├── email.js                   # Email sending
│   └── envUpdater.js              # Environment utils
├── reports/
│   └── reports_index.json         # Report definitions
├── reporting-dashboard/           # React + Vite frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RecordForm.jsx
│   │   │   ├── RecordTable.jsx
│   │   │   ├── ReportGenerator.jsx
│   │   │   ├── ArchivedReports.jsx
│   │   │   ├── ArchivedReportsModal.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   └── ResetPasswordForm.jsx
│   │   ├── services/
│   │   │   └── api.js            # Axios instance
│   │   └── styles/               # Component styles
│   └── public/
└── README.md                      # This file
```

---

## Prerequisites
- **Node.js** v14+ (LTS recommended)
- **npm** v6+ (included with Node.js)
- **MySQL** v5.7+ or MySQL 8.0
- **Git**

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
