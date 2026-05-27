# Reporting System

A web-based reporting system with:
- **Backend API** (Node.js / Express) for generating and serving reports
- **Reporting dashboard** (React + Vite) for viewing and interacting with reports

> Branch note: this repository has a branch named `feature/security-restrictions` which appears to focus on access control / restrictions.

---

## Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Running Locally](#installation--running-locally)
- [Configuration (Environment Variables)](#configuration-environment-variables)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Using the System](#using-the-system)
- [API Testing](#api-testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Git Workflow](#git-workflow)
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

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer with Gmail SMTP

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **HTTP Client**: Axios
- **State Management**: React Hooks

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

### Backend `.env` Configuration

Create `.env` file in root directory with the following variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Connection
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=reporting_system

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Authentication
ADMIN_EMAIL=admin@example.com
JWT_SECRET=your_64_character_jwt_secret_key_here
ADMIN_PASSWORD_HASH=$2b$12$hashed_password_here
RESET_PASSWORD_SECRET=your_64_character_reset_secret_key_here

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=Admin Reset <your_email@gmail.com>

# Frontend URLs
FRONTEND_URL=http://localhost:5173
RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES=15
```

### Environment Variables Reference

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `PORT` | number | ✅ | Backend server port (default: 3000) |
| `NODE_ENV` | string | ✅ | `development` or `production` |
| `DB_HOST` | string | ✅ | MySQL server hostname/IP |
| `DB_PORT` | number | ✅ | MySQL server port (default: 3306) |
| `DB_USER` | string | ✅ | MySQL username |
| `DB_PASSWORD` | string | ✅ | MySQL password |
| `DB_NAME` | string | ✅ | Database name |
| `JWT_SECRET` | string | ✅ | Secret key for JWT signing (min 64 chars) |
| `RESET_PASSWORD_SECRET` | string | ✅ | Secret for password reset tokens (min 64 chars) |
| `EMAIL_HOST` | string | ✅ | SMTP server hostname |
| `EMAIL_PORT` | number | ✅ | SMTP server port |
| `EMAIL_SECURE` | boolean | ✅ | Use TLS (true/false) |
| `EMAIL_USER` | string | ✅ | Email account for sending |
| `EMAIL_PASS` | string | ✅ | Email account password or app password |
| `EMAIL_FROM` | string | ✅ | Email sender name and address |
| `ADMIN_EMAIL` | string | ✅ | Default admin email |
| `ADMIN_PASSWORD_HASH` | string | ✅ | Bcrypt hashed admin password |
| `CORS_ORIGINS` | string | ✅ | Comma-separated allowed origins |
| `FRONTEND_URL` | string | ✅ | Frontend application URL |
| `RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES` | number | ✅ | Token expiration time in minutes |

### Gmail Setup (for Email Notifications)

To send password reset emails via Gmail:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Windows PC" (or your OS)
5. Copy the 16-character password generated
6. Paste it in `.env` as `EMAIL_PASS`

> **Important**: Always use App Passwords for SMTP, never use your regular Gmail password

### Generating JWT Secrets

Generate random secrets for `JWT_SECRET` and `RESET_PASSWORD_SECRET`:

```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256})) | ForEach-Object {$_ -replace '[^A-Za-z0-9]', ''} | ForEach-Object {$_.Substring(0,64)}
```

### Creating Admin Password Hash

Generate bcrypt hash for admin password:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your_password', 12));"
```

---

## Using the System

### First-Time Setup

1. **Start Backend**
   ```bash
   npm start
   ```
   Backend will be available at `http://localhost:3000`

2. **Start Frontend**
   ```bash
   cd reporting-dashboard
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

3. **Login**
   - Navigate to `http://localhost:5173`
   - Enter admin credentials from `.env`
   - Click "Login"

### Dashboard Features

#### 📊 View Records
- Click "Records" in navigation
- View all records in table format
- Use filters to search records
- Pagination automatically loads more records

#### ➕ Create New Record
- Click "New Record" button
- Fill in required fields
- Click "Submit"
- Record appears in table

#### ✏️ Edit Record
- Click record row
- Modify fields
- Click "Save"

#### 📄 Generate Reports
- Click "Reports" section
- Select report type
- Apply filters (date range, status, etc.)
- Click "Generate"
- Download PDF file

#### 📦 Archive Records
- Select records from table
- Click "Archive" button
- Records move to archived section
- Can be restored from "Archived Reports"

#### 🔑 Manage Passwords
- Click user profile icon
- Select "Reset Password"
- Enter new password
- Email verification sent

---

## API Testing

### VS Code REST Client

1. Install "REST Client" extension by Huachao Zheng
2. Open `test.http` file
3. Click "Send Request" above each request
4. View response in editor

### Using cURL

**Login and get token**:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

echo $TOKEN
```

**Get records with token**:
```bash
curl -X GET http://localhost:3000/api/records?page=1&limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Import `test.http` into Postman
2. Set `base_url` variable: `http://localhost:3000`
3. Set `token` variable from login response
4. Run requests with authorization

---

## Troubleshooting

### Backend Issues

#### Backend won't start / Server error
```bash
# Check if port is already in use
netstat -ano | findstr :3000

# Kill the process (Windows PowerShell)
Stop-Process -Id <PID> -Force

# Try starting again
npm start
```

#### Database connection failed
```bash
✅ Verify MySQL is running
✅ Check credentials in .env (DB_HOST, DB_USER, DB_PASSWORD)
✅ Ensure database exists: mysql -u root -p -e "SHOW DATABASES;"
✅ Check MySQL port (default 3306, custom 3307)
```

**Common fix**:
```bash
# Restart MySQL service
net stop MySQL80
net start MySQL80

# Or verify database exists
mysql -u root -p reporting_system -e "SELECT 1;"
```

#### JWT token errors / Token expired
```
Error: "Unauthorized" or "Invalid token"

Solution:
✅ Verify JWT_SECRET is set correctly in .env
✅ Clear browser cookies and login again
✅ Check token expiration time
✅ Generate new JWT_SECRET if needed
```

#### Email not sending
```
Error: "Failed to send email" or SMTP error

Check:
✅ Gmail 2-Factor Authentication is enabled
✅ Using App Password (not regular password)
✅ EMAIL_USER matches Gmail account
✅ EMAIL_PASS is correct (16 chars with spaces)
✅ No firewall blocking SMTP port 587

Verify:
node -e "const nodemailer = require('nodemailer'); console.log('Nodemailer loaded');"
```

#### CORS errors in browser console
```
Error: "Access to XMLHttpRequest blocked by CORS policy"

Solution:
✅ Check CORS_ORIGINS in .env includes http://localhost:5173
✅ Verify frontend is running on correct port
✅ Restart backend after changing CORS_ORIGINS
```

---

### Frontend Issues

#### Frontend won't load
```bash
# Check if frontend server is running
curl http://localhost:5173

# Check npm output for errors
cd reporting-dashboard
npm run dev

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Backend connection fails / "Cannot GET /api/..."
```bash
✅ Verify backend is running on port 3000
✅ Check API base URL in frontend config
✅ Check browser DevTools Network tab
✅ Verify CORS_ORIGINS includes http://localhost:5173
✅ Look for error messages in backend console
```

#### Login page loops infinitely
```bash
✅ Check JWT token in browser localStorage
✅ Verify admin credentials in .env
✅ Check backend /api/auth/login response
✅ Clear browser cookies and try again
```

#### Records table is empty
```bash
✅ Verify database has records
✅ Check user role permissions
✅ Verify database connection in backend
✅ Check for JavaScript errors in browser console
```

---

### Database Issues

#### Database tables missing
```bash
# Create tables manually
mysql -u root -p reporting_system < reporting_system_corrected.sql

# Or run setup script
node setup-db.js
```

#### Access denied error
```bash
# Check MySQL credentials
mysql -u root -p -h 127.0.0.1 -P 3307

# Verify user permissions
mysql -u root -p -e "SHOW GRANTS FOR 'root'@'localhost';"
```

#### Disk space error
```bash
# Check MySQL data directory
SHOW VARIABLES LIKE 'datadir';

# Free up space and restart MySQL
```

---

### Performance Issues

#### Slow database queries
```bash
# Enable query logging
# In MySQL: SET GLOBAL slow_query_log = 'ON';

# Check for missing indexes
SHOW INDEX FROM records;

# Create indexes if needed
CREATE INDEX idx_email ON records(email);
CREATE INDEX idx_status ON records(status);
```

#### High memory usage
```bash
# Restart Node server
pm2 restart reporting-system

# Check for memory leaks in code
node --inspect server.js
# Use Chrome DevTools for debugging
```

---

### Quick Diagnostics

Run this script to check all services:
```bash
#!/bin/bash
echo "Checking Node.js..."
node --version

echo "Checking npm..."
npm --version

echo "Checking MySQL..."
mysql --version

echo "Checking backend..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Backend OK" || echo "❌ Backend DOWN"

echo "Checking frontend..."
curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend DOWN"

echo "Checking database..."
mysql -u root -p reporting_system -e "SELECT COUNT(*) FROM records;" > /dev/null && echo "✅ Database OK" || echo "❌ Database DOWN"
```

---

## License
Proprietary - All rights reserved

---

## Database Setup

The database is automatically created when you run:
```bash
node setup-db.js
```

For manual setup:
```sql
CREATE DATABASE reporting_system;
USE reporting_system;
source reporting_system_corrected.sql;
```

---

## API Documentation

### Authentication Endpoints

**POST** `/api/auth/login`
- **Description**: Authenticate user with email and password
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "role": "admin"
    }
  }
  ```
- **Status**: 200 OK or 401 Unauthorized

---

**POST** `/api/auth/logout`
- **Description**: Logout current user
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "message": "Logged out successfully" }`
- **Status**: 200 OK

---

**POST** `/api/auth/reset-password`
- **Description**: Request password reset email
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "admin@example.com"
  }
  ```
- **Response**: `{ "message": "Reset email sent" }`
- **Status**: 200 OK

---

### Record Endpoints

**GET** `/api/records`
- **Description**: Fetch all records with pagination
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `filter` (optional search filter)
- **Response**:
  ```json
  {
    "records": [
      {
        "id": 1,
        "name": "Record Name",
        "email": "user@example.com",
        "status": "active",
        "createdAt": "2026-05-27T10:00:00Z",
        "archivedAt": null
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
  ```
- **Status**: 200 OK

---

**POST** `/api/records`
- **Description**: Create a new record
- **Headers**: `Authorization: Bearer <token>, Content-Type: application/json`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "status": "active"
  }
  ```
- **Response**: Created record object
- **Status**: 201 Created

---

**PUT** `/api/records/:id`
- **Description**: Update a record
- **Headers**: `Authorization: Bearer <token>, Content-Type: application/json`
- **Body**: Fields to update
- **Response**: Updated record object
- **Status**: 200 OK

---

**DELETE** `/api/records/:id`
- **Description**: Soft delete a record (archive)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "message": "Record archived successfully" }`
- **Status**: 200 OK

---

### Report Endpoints

**GET** `/api/reports`
- **Description**: List all available reports
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "reports": [
      {
        "id": "monthly-summary",
        "name": "Monthly Summary Report",
        "description": "Summary of monthly activities",
        "filters": ["startDate", "endDate", "status"]
      }
    ]
  }
  ```
- **Status**: 200 OK

---

**POST** `/api/reports/generate`
- **Description**: Generate PDF report
- **Headers**: `Authorization: Bearer <token>, Content-Type: application/json`
- **Body**:
  ```json
  {
    "reportType": "monthly-summary",
    "startDate": "2026-05-01",
    "endDate": "2026-05-31",
    "filters": {
      "status": "active"
    }
  }
  ```
- **Response**: PDF file (binary)
- **Status**: 200 OK

---

**GET** `/api/reports/archived`
- **Description**: Fetch archived reports
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `page`, `limit`
- **Response**: Array of archived records
- **Status**: 200 OK

---

## Testing

### Unit Testing
Run existing tests:
```bash
npm test
```

### API Testing with REST Client

Use the `test.http` file with VS Code's REST Client extension.

### Manual Testing with cURL

**Login**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

**Get Records**:
```bash
curl -X GET http://localhost:3000/api/records \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Create Record**:
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234"
  }'
```

### Postman Collection

Import the `test.http` file into Postman for comprehensive API testing.

---

## Deployment

### Production Setup

1. **Environment Configuration**
```bash
NODE_ENV=production
PORT=3000
DB_HOST=your_production_db_host
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_production_secret_key
```

2. **Build Frontend**
```bash
cd reporting-dashboard
npm run build
```

3. **Start Backend with PM2** (recommended for production)
```bash
npm install -g pm2
pm2 start server.js --name "reporting-system"
pm2 save
pm2 startup
```

4. **Setup Reverse Proxy** (nginx example)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Enable HTTPS with Let's Encrypt**
```bash
sudo certbot --nginx -d yourdomain.com
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN cd reporting-dashboard && npm install && npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t reporting-system .
docker run -p 3000:3000 --env-file .env reporting-system
```

### Cloud Deployment (Heroku)

```bash
heroku create your-app-name
heroku addons:create cleardb:ignite
git push heroku main
```

---

## Git Workflow

### Creating a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### Making Changes
```bash
git add .
git commit -m "feat: add new feature description"
```

### Pushing to GitHub
```bash
git push -u origin feature/your-feature-name
```

### Creating Pull Request
1. Go to GitHub repository
2. Click "Compare & pull request"
3. Add description and submit

### Merging to Main
```bash
git checkout main
git pull origin main
git merge feature/your-feature-name
git push origin main
```

### Available Branches
- `main` – Production-ready code
- `develop` – Development branch
- `most-updated-branch` – Latest features
- `feature/security-restrictions` – Enhanced access control

---
