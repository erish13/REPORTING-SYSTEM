import React from 'react';
import '../styles/RecordTable.css';

function RecordTable({ records = [], loading = false, onDelete }) {
  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-PH');
  };

  const formatMoney = (value) => {
    const n = Number(value);
    const safe = Number.isFinite(n) ? n : 0;
    return `₱ ${safe.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div>
      <h2>📋 All Records</h2>

      {loading ? (
        <p>Loading records...</p>
      ) : (
        <div className="record-table-wrapper">
          <table className="records-table">
            <thead>
              <tr>
                <th>Record Date</th>
                <th>Organization/Unit</th>
                <th>Office in Charge</th>
                <th>Proposed Activity</th>
                <th>Venue</th>
                <th className="money">Environmental Fee</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.date)}</td>
                    <td title={r.organization_unit}>{r.organization_unit}</td>
                    <td title={r.office_in_charge}>{r.office_in_charge}</td>
                    <td title={r.proposed_activity}>{r.proposed_activity}</td>
                    <td title={r.venue}>{r.venue}</td>
                    <td className="money">{formatMoney(r.environmental_fee)}</td>

                    <td className="actions">
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => onDelete && onDelete(r.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecordTable;