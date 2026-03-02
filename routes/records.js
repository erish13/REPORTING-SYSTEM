const express = require('express');
const recordController = require('../controllers/recordController');

const router = express.Router();

// Special routes FIRST (before :id parameter)
router.get('/summary/stats', recordController.getRecordSummary);
router.get('/filter/query', recordController.filterRecords);

// Standard CRUD routes
router.post('/', recordController.createRecord);
router.get('/', recordController.getAllRecords);
router.get('/:id', recordController.getRecordById);
router.put('/:id', recordController.updateRecord);
router.delete('/:id', recordController.deleteRecord);

module.exports = router;