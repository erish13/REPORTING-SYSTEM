const express = require('express');
const reportController = require('../controllers/reportController');

const router = express.Router();

// Report endpoints
router.get('/pdf', reportController.generatePDFReport);
router.get('/excel', reportController.generateExcelReport);
router.get('/summary', reportController.getReportSummary);

// Archived reports endpoints
router.get('/archived', reportController.listArchivedReports);
router.get('/archived/weeks', reportController.getArchivedWeeks);
router.get('/archived/week/:weekKey', reportController.generateArchivedWeekReport);

module.exports = router;
