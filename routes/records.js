const express = require('express');
const router = express.Router();
const { auth, authorize, ownerOnly } = require('../middleware/auth');
const recordController = require('../controllers/recordController'); // make sure filename is exactly this

// Admin-owner protection
router.use(auth, authorize('ADMIN'), ownerOnly);

// CRUD
router.post('/', recordController.createRecord);
router.get('/', recordController.getAllRecords);

// specific routes first
router.get('/filter/query', recordController.filterRecords);
router.get('/summary/stats', recordController.getRecordSummary);

// param routes last
router.get('/:id', recordController.getRecordById);
router.put('/:id', recordController.updateRecord);
router.delete('/:id', recordController.deleteRecord);

module.exports = router;