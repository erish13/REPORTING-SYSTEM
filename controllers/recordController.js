const Record = require('../models/Record');
const { getDateRange } = require('../utils/dateUtils');
const db = require('../config/db'); // ✅ add DB access for DB-side filtering

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
      activity_date_from,
      activity_date_to,
      time_in,
      time_out,
      no_of_participants,
      environmental_fee,
    } = req.body;

    if (
      !date ||
      !organization_unit ||
      !office_in_charge ||
      !proposed_activity ||
      !venue ||
      !activity_date_from ||
      !activity_date_to ||
      !time_in ||
      !time_out ||
      !no_of_participants
    ) {
      return res.status(400).json({
        error:
          'Missing required fields: date, organization_unit, office_in_charge, proposed_activity, venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants',
      });
    }

    if (isNaN(no_of_participants) || Number(no_of_participants) <= 0) {
      return res.status(400).json({ error: 'Number of participants must be a positive number' });
    }

    const fee =
      environmental_fee === undefined || environmental_fee === null || environmental_fee === ''
        ? 0
        : Number(environmental_fee);

    if (Number.isNaN(fee) || fee < 0) {
      return res.status(400).json({ error: 'Environmental fee must be a number 0 or greater' });
    }

    const result = await Record.create({
      date,
      organization_unit,
      office_in_charge,
      proposed_activity,
      venue,
      activity_date_from,
      activity_date_to,
      time_in,
      time_out,
      no_of_participants,
      environmental_fee: fee,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllRecords = async (req, res) => {
  try {
    const records = await Record.getAll();
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid record ID' });

    const record = await Record.getById(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      organization_unit,
      office_in_charge,
      proposed_activity,
      venue,
      activity_date_from,
      activity_date_to,
      time_in,
      time_out,
      no_of_participants,
      environmental_fee,
    } = req.body;

    if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid record ID' });

    const existingRecord = await Record.getById(id);
    if (!existingRecord) return res.status(404).json({ error: 'Record not found' });

    if (no_of_participants && (isNaN(no_of_participants) || Number(no_of_participants) <= 0)) {
      return res.status(400).json({ error: 'Number of participants must be a positive number' });
    }

    let feeToSave = existingRecord.environmental_fee ?? 0;
    if (environmental_fee !== undefined && environmental_fee !== null && environmental_fee !== '') {
      const parsedFee = Number(environmental_fee);
      if (Number.isNaN(parsedFee) || parsedFee < 0) {
        return res.status(400).json({ error: 'Environmental fee must be a number 0 or greater' });
      }
      feeToSave = parsedFee;
    }

    const result = await Record.update(id, {
      date: date || existingRecord.date,
      organization_unit: organization_unit || existingRecord.organization_unit,
      office_in_charge: office_in_charge || existingRecord.office_in_charge,
      proposed_activity: proposed_activity || existingRecord.proposed_activity,
      venue: venue || existingRecord.venue,
      activity_date_from: activity_date_from || existingRecord.activity_date_from,
      activity_date_to: activity_date_to || existingRecord.activity_date_to,
      time_in: time_in || existingRecord.time_in,
      time_out: time_out || existingRecord.time_out,
      no_of_participants: no_of_participants || existingRecord.no_of_participants,
      environmental_fee: feeToSave,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid record ID' });

    const result = await Record.delete(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * FILTER: Fix "Today" not showing by using DB-side date filters (MySQL/MariaDB)
 * GET /api/records/filter/query?period=daily|weekly|monthly|custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * NOTE:
 * - Uses created_at for period filtering (consistent with reports controller).
 * - If you want to filter by the "date" column instead, replace created_at with date in the SQL.
 */
exports.filterRecords = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    if (!period) {
      return res.status(400).json({ error: 'Period parameter required: daily, weekly, monthly, custom' });
    }

    let sql = `
      SELECT
        id,
        date,
        organization_unit,
        office_in_charge,
        proposed_activity,
        venue,
        activity_date,
        time_in,
        time_out,
        no_of_participants,
        environmental_fee,
        created_at
      FROM records
      WHERE 1=1
    `;
    const params = [];

    if (period === 'daily') {
      sql += ' AND DATE(created_at) = CURDATE()';
    } else if (period === 'weekly') {
      sql += ' AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (period === 'monthly') {
      sql += ' AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
    } else if (period === 'yearly') {
      sql += ' AND YEAR(created_at) = YEAR(CURDATE())';
    } else if (period === 'custom') {
      // keep old behavior but DB-side + inclusive by date
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Custom period requires startDate and endDate' });
      }
      sql += ' AND DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else {
      // fallback to old JS util if you still pass other periods
      const { startDate: start, endDate: end } = getDateRange(period, startDate, endDate);
      let records = await Record.getByDateRange(start, end);
      return res.status(200).json({ success: true, data: records });
    }

    sql += ' ORDER BY created_at DESC';

    const [records] = await db.execute(sql, params);

    // Keep response shape expected by your UI
    return res.status(200).json({
      success: true,
      data: records || [],
      // keep summary field so frontend won't break if it expects it
      summary: {
        total_records: (records || []).length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecordSummary = async (req, res) => {
  try {
    const summary = await Record.getSummary();
    res.status(200).json({
      success: true,
      summary: {
        total_records: summary.total_records || 0,
        total_units: summary.total_units || 0,
        total_participants: summary.total_participants || 0,
        total_environmental_fee: summary.total_environmental_fee || 0,
        latest_activity: summary.latest_activity,
        earliest_activity: summary.earliest_activity,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};