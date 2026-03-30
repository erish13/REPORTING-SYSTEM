const pool = require('../config/db');

class Record {
  static async create(data) {
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
    } = data;

    const query = `
      INSERT INTO records 
      (date, organization_unit, office_in_charge, proposed_activity, 
       venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
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
      environmental_fee ?? 0,
    ]);

    return { success: true, id: result.insertId, message: 'Record created successfully' };
  }

  static async getAll() {
    const query = `
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee, created_at
      FROM records
      WHERE deleted_at IS NULL
      ORDER BY activity_date_from DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query(
      `
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee, created_at
      FROM records
      WHERE id = ?
    `,
      [id]
    );
    return rows[0] || null;
  }

  static async update(id, data) {
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
    } = data;

    const [result] = await pool.query(
      `
      UPDATE records
      SET date = ?, organization_unit = ?, office_in_charge = ?, 
          proposed_activity = ?, venue = ?, activity_date_from = ?, activity_date_to = ?,
          time_in = ?, time_out = ?, no_of_participants = ?, environmental_fee = ?
      WHERE id = ?
    `,
      [
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
        environmental_fee ?? 0,
        id,
      ]
    );

    if (result.affectedRows === 0) return { success: false, message: 'Record not found' };
    return { success: true, message: 'Record updated successfully' };
  }

  // Soft delete - archives the record
  static async delete(id) {
    const [result] = await pool.query(
      `UPDATE records SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    if (result.affectedRows === 0) return { success: false, message: 'Record not found or already archived' };
    return { success: true, message: 'Record archived successfully' };
  }

  // Get all archived records
  static async getArchived() {
    const [rows] = await pool.query(`
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee, created_at, deleted_at
      FROM records
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `);
    return rows || [];
  }

  // Restore an archived record
  static async restore(id) {
    const [result] = await pool.query(
      `UPDATE records SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL`,
      [id]
    );
    if (result.affectedRows === 0) return { success: false, message: 'Record not found or not archived' };
    return { success: true, message: 'Record restored successfully' };
  }

  // Permanently delete a record (hard delete)
  static async permanentlyDelete(id) {
    const [result] = await pool.query(`DELETE FROM records WHERE id = ?`, [id]);
    if (result.affectedRows === 0) return { success: false, message: 'Record not found' };
    return { success: true, message: 'Record permanently deleted' };
  }

  // Auto-delete archived records older than 30 days
  static async deleteArchivedOlderThan30Days() {
    const [result] = await pool.query(
      `DELETE FROM records WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    return { success: true, deletedCount: result.affectedRows };
  }

  static async getByDateRange(startDate, endDate) {
    const [rows] = await pool.query(
      `
      SELECT 
        id, date, organization_unit, office_in_charge, proposed_activity,
        venue, activity_date_from, activity_date_to, time_in, time_out, no_of_participants, environmental_fee, created_at
      FROM records
      WHERE activity_date_from BETWEEN ? AND ?
      ORDER BY activity_date_from DESC
    `,
      [startDate, endDate]
    );
    return rows;
  }

  static async getSummary() {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT organization_unit) as total_units,
        SUM(CAST(no_of_participants AS UNSIGNED)) as total_participants,
        SUM(COALESCE(environmental_fee, 0)) as total_environmental_fee,
        MAX(activity_date) as latest_activity,
        MIN(activity_date) as earliest_activity
      FROM records
    `);
    return rows[0] || {};
  }
}

module.exports = Record;