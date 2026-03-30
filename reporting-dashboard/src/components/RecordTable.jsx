import React, { useState } from 'react';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import '../styles/RecordTable.css';

function RecordTable({ records = [], loading = false, onDelete, onEdit }) {
  const [selectedRecord, setSelectedRecord] = useState(null);

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-PH') : '');

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString('en-PH') : '');

  const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate) || '-';
    const end = formatDate(endDate) || '-';
    return `${start} to ${end}`;
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) {
      hour = hour - 12;
    } else if (hour === 0) {
      hour = 12;
    }
    return `${String(hour).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Truncate text to 10 characters with ellipsis
  const truncate = (text, length = 10) => {
    if (!text) return '';
    const str = String(text);
    return str.length > length ? `${str.substring(0, length)}...` : str;
  };

  // Amount only (no ₱ here) for accounting-style layout in the cell
  const formatAmount = (value) =>
    Number(value || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div>
      <h2>All Records</h2>
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
                <th>Activity Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>No. of Participants</th>
                <th className="money fee-col">Environmental Fee</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center' }}>
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.date)}</td>
                    <td>{truncate(r.organization_unit)}</td>
                    <td>{truncate(r.office_in_charge)}</td>
                    <td>{truncate(r.proposed_activity)}</td>
                    <td>{truncate(r.venue)}</td>
                    <td>
                      {r.activity_date_from && r.activity_date_to ? (
                        <>
                          <span>{formatDate(r.activity_date_from)}</span>
                          <br />
                          <span style={{ fontSize: '11px', color: '#666' }}>to {formatDate(r.activity_date_to)}</span>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{r.time_in ? formatTime(r.time_in) : '-'}</td>
                    <td>{r.time_out ? formatTime(r.time_out) : '-'}</td>
                    <td style={{ textAlign: 'center' }}>{r.no_of_participants}</td>
                    <td className="money fee-col">
                      <span className="fee-cell">
                        <span className="fee-symbol">₱</span>
                        <span className="fee-amount">{formatAmount(r.environmental_fee)}</span>
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        type="button" 
                        className="btn-action btn-view" 
                        title="View Details"
                        onClick={() => setSelectedRecord(r)}
                      >
                        <FiEye size={16} />
                      </button>
                      {onEdit && (
                        <button 
                          type="button" 
                          className="btn-action btn-edit" 
                          title="Edit"
                          onClick={() => onEdit(r.id)}
                        >
                          <FiEdit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          type="button" 
                          className="btn-action btn-delete" 
                          title="Delete"
                          onClick={() => onDelete(r.id)}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Details</h2>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSelectedRecord(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <label>Record Date:</label>
                <span>{formatDate(selectedRecord.date)}</span>
              </div>
              <div className="detail-row">
                <label>Organization/Unit:</label>
                <span>{selectedRecord.organization_unit}</span>
              </div>
              <div className="detail-row">
                <label>Officer in Charge:</label>
                <span>{selectedRecord.office_in_charge}</span>
              </div>
              <div className="detail-row">
                <label>Proposed Activity:</label>
                <span>{selectedRecord.proposed_activity}</span>
              </div>
              <div className="detail-row">
                <label>Venue:</label>
                <span>{selectedRecord.venue}</span>
              </div>
              <div className="detail-row">
                <label>Activity Date:</label>
                <span>
                  {selectedRecord.activity_date_from && selectedRecord.activity_date_to ? (
                    <>
                      <span>{formatDate(selectedRecord.activity_date_from)}</span>
                      <br />
                      <span style={{ fontSize: '11px', color: '#666' }}>to {formatDate(selectedRecord.activity_date_to)}</span>
                    </>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              <div className="detail-row">
                <label>Time In:</label>
                <span>{formatTime(selectedRecord.time_in)}</span>
              </div>
              <div className="detail-row">
                <label>Time Out:</label>
                <span>{formatTime(selectedRecord.time_out)}</span>
              </div>
              <div className="detail-row">
                <label>No. of Participants:</label>
                <span>{selectedRecord.no_of_participants}</span>
              </div>
              <div className="detail-row">
                <label>Environmental Fee:</label>
                <span>₱ {formatAmount(selectedRecord.environmental_fee)}</span>
              </div>
              <div className="detail-row">
                <label>Created At:</label>
                <span>{formatDateTime(selectedRecord.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordTable;