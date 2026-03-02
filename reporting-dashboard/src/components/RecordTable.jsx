import React from 'react';
import '../styles/RecordTable.css';

function RecordTable({ records, loading, onDelete }) {
  if (loading) {
    return <div className="loading">⏳ Loading records...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="no-data">
        <p>📭 No records found. Create one to get started!</p>
      </div>
    );
  }

  const formatTime = (time) => {
    if (!time) return '-';

    // Parse time string (HH:MM)
    const [hours, minutes] = time.substring(0, 5).split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    if (hour > 12) {
      hour = hour - 12;
    } else if (hour === 0) {
      hour = 12;
    }

    // Format: "08:17 AM"
    return `${String(hour).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PH');
  };

  return (
    <div className="record-table">
      <h2>📋 All Records</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="col-date">Record Date</th>
              <th className="col-organization">Organization/Unit</th>
              <th className="col-office">Office in Charge</th>
              <th className="col-activity">Proposed Activity</th>
              <th className="col-venue">Venue</th>
              <th className="col-activity-date">Activity Date</th>
              <th className="col-time">Time In (AM/PM)</th>
              <th className="col-time">Time Out (AM/PM)</th>
              <th className="col-participants">Participants</th>
              <th className="col-actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td className="col-date">
                  {formatDate(record.date)}
                </td>
                <td className="col-organization">
                  <span className="bold">{record.organization_unit}</span>
                </td>
                <td className="col-office">
                  {record.office_in_charge}
                </td>
                <td className="col-activity">
                  {record.proposed_activity}
                </td>
                <td className="col-venue">
                  {record.venue}
                </td>
                <td className="col-activity-date">
                  {formatDate(record.activity_date)}
                </td>
                <td className="col-time center">
                  {formatTime(record.time_in)}
                </td>
                <td className="col-time center">
                  {formatTime(record.time_out)}
                </td>
                <td className="col-participants center">
                  <span className="bold">{record.no_of_participants}</span>
                </td>
                <td className="col-actions">
                  <button
                    className="btn"
                    onClick={() => onDelete(record.id)}
                    title="Delete record"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="record-count">
        ✓ Total: <strong>{records.length}</strong> records
      </p>
    </div>
  );
}

export default RecordTable;