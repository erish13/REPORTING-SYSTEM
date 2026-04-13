const express = require('express');
const router = express.Router();
const { auth, authorize, ownerOnly } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Protect all report routes
router.use(auth, authorize('ADMIN'), ownerOnly);

// Needed by frontend
router.get('/summary', reportController.getSummary);
router.get('/pdf', reportController.downloadPDF);
router.get('/excel', reportController.downloadExcel);

module.exports = router;