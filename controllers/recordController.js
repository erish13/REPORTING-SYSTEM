const Record = require('../models/Record');
const { getDateRange } = require('../utils/dateUtils');

/**
 * CREATE: Add a new record
 * POST /api/records
 */
exports.createRecord = async (req, res) => {
  try {
    const {
      date,
      organization_unit,
      office_in_charge,
      proposed_activity,
      venue,
      activity_date,
      time_in,
      time_out,
      no_of_participants,
    } = req.body;

    // Validation
    if (
      !date ||
      !organization_unit ||
      !office_in_charge ||
      !proposed_activity ||
      !venue ||
      !activity_date ||
      !time_in ||
      !time_out ||
      !no_of_participants
    ) {
      return res.status(400).json({
        error:
          'Missing required fields: date, organization_unit, office_in_charge, proposed_activity, venue, activity_date, time_in, time_out, no_of_participants',
      });
    }

    if (isNaN(no_of_participants) || no_of_participants <= 0) {
      return res
        .status(400)
        .json({ error: 'Number of participants must be a positive number' });
    }

    const result = await Record.create({
      date,
      organization_unit,
      office_in_charge,
      proposed_activity,
      venue,
      activity_date,
      time_in,
      time_out,
      no_of_participants,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * READ: Get all records
 * GET /api/records
 */
exports.getAllRecords = async (req, res) => {
  try {
    const records = await Record.getAll();
    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * READ: Get single record by ID
 * GET /api/records/:id
 */
exports.getRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid record ID' });
    }

    const record = await Record.getById(id);

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * UPDATE: Modify existing record
 * PUT /api/records/:id
 */
exports.updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      organization_unit,
      office_in_charge,
      proposed_activity,
      venue,
      activity_date,
      time_in,
      time_out,
      no_of_participants,
    } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid record ID' });
    }

    // Check if record exists
    const existingRecord = await Record.getById(id);
    if (!existingRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Validation
    if (no_of_participants && (isNaN(no_of_participants) || no_of_participants <= 0)) {
      return res
        .status(400)
        .json({ error: 'Number of participants must be a positive number' });
    }

    const result = await Record.update(id, {
      date: date || existingRecord.date,
      organization_unit: organization_unit || existingRecord.organization_unit,
      office_in_charge: office_in_charge || existingRecord.office_in_charge,
      proposed_activity: proposed_activity || existingRecord.proposed_activity,
      venue: venue || existingRecord.venue,
      activity_date: activity_date || existingRecord.activity_date,
      time_in: time_in || existingRecord.time_in,
      time_out: time_out || existingRecord.time_out,
      no_of_participants: no_of_participants || existingRecord.no_of_participants,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE: Remove a record
 * DELETE /api/records/:id
 */
exports.deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid record ID' });
    }

    const result = await Record.delete(id);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * FILTER: Get records by date range
 * GET /api/records/filter/query?period=daily
 */
exports.filterRecords = async (req, res) => {
  try {
    const { period, startDate, endDate, type } = req.query;

    if (!period) {
      return res.status(400).json({
        error: 'Period parameter required: daily, weekly, monthly, custom',
      });
    }

    // Get date range
    const { startDate: start, endDate: end } = getDateRange(
      period,
      startDate,
      endDate
    );

    console.log(
      `Filtering records from ${start} to ${end} for period: ${period}`
    );

    // Fetch records by date range
    let records = await Record.getByDateRange(start, end);

    console.log(`Found ${records.length} records`);

    // Filter by type if specified
    if (type) {
      records = records.filter((r) => r.type === type);
    }

    // Calculate summary
    const summary = {
      income: {
        total: 0,
        count: 0,
      },
      expense: {
        total: 0,
        count: 0,
      },
      net: 0,
    };

    records.forEach((record) => {
      if (record.type === 'income') {
        summary.income.total += parseFloat(record.amount);
        summary.income.count += 1;
      } else if (record.type === 'expense') {
        summary.expense.total += parseFloat(record.amount);
        summary.expense.count += 1;
      }
    });

    summary.net = summary.income.total - summary.expense.total;

    res.status(200).json({
      success: true,
      data: records,
      summary,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * SUMMARY: Get summary statistics
 * GET /api/records/summary/stats
 */
exports.getRecordSummary = async (req, res) => {
  try {
    const summary = await Record.getSummary();

    res.status(200).json({
      success: true,
      summary: {
        total_records: summary.total_records || 0,
        total_units: summary.total_units || 0,
        total_participants: summary.total_participants || 0,
        latest_activity: summary.latest_activity,
        earliest_activity: summary.earliest_activity,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};