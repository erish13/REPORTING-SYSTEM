import React from 'react';
import '../styles/RecordTable.css';

function RecordTable({ records = [], loading = false, onDelete }) {
  const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-PH') : '');
  const formatMoney = (value) => `₱ ${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div>
      <h2>📋 All Records</h2>
      {loading ? <p>Loading records...</p> : (
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
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>No records found</td></tr>
              ) : records.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.organization_unit}</td>
                  <td>{r.office_in_charge}</td>
                  <td>{r.proposed_activity}</td>
                  <td>{r.venue}</td>
                  <td className="money">{formatMoney(r.environmental_fee)}</td>
                  <td className="actions">
                    <button type="button" className="btn-delete" onClick={() => onDelete?.(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecordTable;