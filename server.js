const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import database connection (tests it immediately)
const db = require('./config/db');

// Import routes
const recordRoutes = require('./routes/records');
const reportRoutes = require('./routes/reports');
const reportController = require('./controllers/reportController');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/records', recordRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   Records: GET http://localhost:${PORT}/api/records`);
  console.log(`   Reports: GET http://localhost:${PORT}/api/reports/pdf?period=daily`);
  console.log(`   Health: GET http://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⛔ Server shutting down...');
  db.end();
  process.exit(0);
});

// Scheduled job: archive previous week if not already archived
const formatYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const archivePreviousWeekIfNeeded = async () => {
  try {
    const today = new Date();
    // previous week reference date
    const ref = new Date(today);
    ref.setDate(ref.getDate() - 7);
    const day = ref.getDay(); // 0 (Sun) .. 6
    const firstDay = new Date(ref);
    firstDay.setDate(ref.getDate() - day);
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    const startDate = formatYMD(firstDay);
    const endDate = formatYMD(lastDay);

    // Check index file
    const indexPath = require('path').join(__dirname, 'reports', 'reports_index.json');
    let index = [];
    if (require('fs').existsSync(indexPath)) {
      try {
        index = JSON.parse(require('fs').readFileSync(indexPath, 'utf8')) || [];
      } catch (e) {
        index = [];
      }
    }

    const already = index.find((r) => r.startDate === startDate && r.endDate === endDate && r.period === 'weekly');
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

// Run once at startup and then every 24 hours
archivePreviousWeekIfNeeded();
setInterval(archivePreviousWeekIfNeeded, 24 * 60 * 60 * 1000);