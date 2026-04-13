const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const recordRoutes = require('./routes/records');
const reportRoutes = require('./routes/reports');
const reportController = require('./controllers/reportController');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// CORS allowlist
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Body parser limits
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/reports', reportRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date(),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  const isProd = process.env.NODE_ENV === 'production';

  res.status(500).json({
    error: 'Internal server error',
    message: isProd ? 'Something went wrong' : error.message,
  });
});

// Start
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   Auth: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   Records: GET http://localhost:${PORT}/api/records`);
  console.log(`   Reports: GET http://localhost:${PORT}/api/reports`);
  console.log(`   Health: GET http://localhost:${PORT}/api/health`);
  console.log(`   CORS allowed origins: ${allowedOrigins.join(', ') || 'none'}\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⛔ Server shutting down...');
  await db.end();
  process.exit(0);
});

// Scheduled job
const formatYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const archivePreviousWeekIfNeeded = async () => {
  try {
    const today = new Date();
    const ref = new Date(today);
    ref.setDate(ref.getDate() - 7);

    const day = ref.getDay();
    const firstDay = new Date(ref);
    firstDay.setDate(ref.getDate() - day);

    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    const startDate = formatYMD(firstDay);
    const endDate = formatYMD(lastDay);

    const path = require('path');
    const fs = require('fs');
    const indexPath = path.join(__dirname, 'reports', 'reports_index.json');

    let index = [];
    if (fs.existsSync(indexPath)) {
      try {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) || [];
      } catch (e) {
        index = [];
      }
    }

    const already = index.find(
      (r) => r.startDate === startDate && r.endDate === endDate && r.period === 'weekly'
    );

    if (already) {
      console.log('Previous week already archived:', startDate, 'to', endDate);
      return;
    }

    console.log('Archiving previous week:', startDate, 'to', endDate);
    const result = await reportController.archiveReport('weekly', { startDate, endDate });

    if (result.success) {
      console.log('Weekly archive complete:', result.filepath);
    } else {
      console.error('Weekly archive failed:', result.error);
    }
  } catch (error) {
    console.error('Archive job error:', error);
  }
};

archivePreviousWeekIfNeeded();
setInterval(archivePreviousWeekIfNeeded, 24 * 60 * 60 * 1000);

/**
 * Auto-delete archived records older than 30 days
 * Runs once daily at startup and then every 24 hours
 */
const cleanupArchivedRecords = async () => {
  try {
    const Record = require('./models/Record');
    const result = await Record.deleteArchivedOlderThan30Days();
    if (result.deletedCount > 0) {
      console.log(`✨ Auto-cleanup: Permanently deleted ${result.deletedCount} archived records older than 30 days`);
    }
  } catch (error) {
    console.error('Auto-cleanup error:', error);
  }
};

// Run cleanup on startup and then every 24 hours
cleanupArchivedRecords();
setInterval(cleanupArchivedRecords, 24 * 60 * 60 * 1000);