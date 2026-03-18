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

  static async delete(id) {
    const [result] = await pool.query(`DELETE FROM records WHERE id = ?`, [id]);
    if (result.affectedRows === 0) return { success: false, message: 'Record not found' };
    return { success: true, message: 'Record deleted successfully' };
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