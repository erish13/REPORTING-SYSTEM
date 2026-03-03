const pool = require('../config/db');

class Record {
  // CREATE: Add a new record
  static async create(data) {
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
      environmental_fee, // NEW
    } = data;

    const query = `
      INSERT INTO records 
      (date, organization_unit, office_in_charge, proposed_activity, 
       venue, activity_date, time_in, time_out, no_of_participants, environmental_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.query(query, [
        date,
        organization_unit,
        office_in_charge,
        proposed_activity,
        venue,
        activity_date,
        time_in,
        time_out,
        no_of_participants,
        environmental_fee ?? 0, // NEW (default)
      ]);

      return {
        success: true,
        id: result.insertId,
        message: 'Record created successfully',
      };
    } catch (error) {
      throw new Error(`Create failed: ${error.message}`);
    }
  }

  // READ: Get all records
  static async getAll() {
    const query = `
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date, time_in, time_out, no_of_participants, environmental_fee, created_at
      FROM records
      ORDER BY activity_date DESC
    `;

    try {
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Fetch all failed: ${error.message}`);
    }
  }

  // READ: Get single record by ID
  static async getById(id) {
    const query = `
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date, time_in, time_out, no_of_participants, environmental_fee, created_at
      FROM records
      WHERE id = ?
    `;

    try {
      const [rows] = await pool.query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Fetch by ID failed: ${error.message}`);
    }
  }

  // UPDATE: Modify existing record
  static async update(id, data) {
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
      environmental_fee, // NEW
    } = data;

    const query = `
      UPDATE records
      SET date = ?, organization_unit = ?, office_in_charge = ?, 
          proposed_activity = ?, venue = ?, activity_date = ?, 
          time_in = ?, time_out = ?, no_of_participants = ?, environmental_fee = ?
      WHERE id = ?
    `;

    try {
      const [result] = await pool.query(query, [
        date,
        organization_unit,
        office_in_charge,
        proposed_activity,
        venue,
        activity_date,
        time_in,
        time_out,
        no_of_participants,
        environmental_fee ?? 0, // NEW
        id,
      ]);

      if (result.affectedRows === 0) {
        return { success: false, message: 'Record not found' };
      }

      return { success: true, message: 'Record updated successfully' };
    } catch (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
  }

  // DELETE: Remove a record
  static async delete(id) {
    const query = `DELETE FROM records WHERE id = ?`;

    try {
      const [result] = await pool.query(query, [id]);

      if (result.affectedRows === 0) {
        return { success: false, message: 'Record not found' };
      }

      return { success: true, message: 'Record deleted successfully' };
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // Filter by date range
  static async getByDateRange(startDate, endDate) {
    const query = `
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date, time_in, time_out, no_of_participants, environmental_fee, created_at
      FROM records
      WHERE activity_date BETWEEN ? AND ?
      ORDER BY activity_date DESC
    `;

    try {
      const [rows] = await pool.query(query, [startDate, endDate]);
      console.log(`Records found for date range ${startDate} to ${endDate}:`, rows.length);
      return rows;
    } catch (error) {
      throw new Error(`Date range filter failed: ${error.message}`);
    }
  }

  // Get summary statistics
  static async getSummary() {
    const query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT organization_unit) as total_units,
        SUM(CAST(no_of_participants AS UNSIGNED)) as total_participants,
        SUM(COALESCE(environmental_fee, 0)) as total_environmental_fee,
        MAX(activity_date) as latest_activity,
        MIN(activity_date) as earliest_activity
      FROM records
    `;

    try {
      const [rows] = await pool.query(query);
      return rows[0] || {};
    } catch (error) {
      throw new Error(`Summary failed: ${error.message}`);
    }
  }

  // Get records by organization
  static async getByOrganization(organization_unit) {
    const query = `
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date, time_in, time_out, no_of_participants, environmental_fee, created_at
      FROM records
      WHERE organization_unit = ?
      ORDER BY activity_date DESC
    `;

    try {
      const [rows] = await pool.query(query, [organization_unit]);
      return rows;
    } catch (error) {
      throw new Error(`Organization filter failed: ${error.message}`);
    }
  }

  // Get active (non-archived) records
  static async getActiveRecords() {
    const query = `
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date, time_in, time_out, no_of_participants, environmental_fee, created_at
      FROM records
      WHERE is_archived = 0
      ORDER BY activity_date DESC
    `;
    try {
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Fetch active records failed: ${error.message}`);
    }
  }

  // Mark records as archived for a specific week
  static async markRecordsAsArchived(startDate, endDate, archiveWeekKey) {
    const query = `
      UPDATE records
      SET is_archived = 1, archive_week_key = ?
      WHERE activity_date BETWEEN ? AND ?
    `;
    try {
      const [result] = await pool.query(query, [archiveWeekKey, startDate, endDate]);
      return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
      throw new Error(`Archive records failed: ${error.message}`);
    }
  }

  // Get archived records by week key
  static async getArchivedRecordsByWeek(archiveWeekKey) {
    const query = `
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date, time_in, time_out, no_of_participants, environmental_fee, created_at, archive_week_key
      FROM records
      WHERE is_archived = 1 AND archive_week_key = ?
      ORDER BY activity_date DESC
    `;
    try {
      const [rows] = await pool.query(query, [archiveWeekKey]);
      return rows;
    } catch (error) {
      throw new Error(`Fetch archived records failed: ${error.message}`);
    }
  }

  // Get all archived weeks
  static async getArchivedWeeks() {
    const query = `
      SELECT DISTINCT 
        archive_week_key, 
        MIN(activity_date) as week_start, 
        MAX(activity_date) as week_end, 
        COUNT(*) as record_count,
        SUM(COALESCE(environmental_fee, 0)) as total_environmental_fee
      FROM records
      WHERE is_archived = 1
      GROUP BY archive_week_key
      ORDER BY archive_week_key DESC
    `;
    try {
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Fetch archived weeks failed: ${error.message}`);
    }
  }
}

module.exports = Record;