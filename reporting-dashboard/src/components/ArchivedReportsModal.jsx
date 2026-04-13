import React, { useEffect, useState } from 'react';
import { FiX, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import '../styles/ArchivedReports.css';

function ArchivedReportsModal({ isOpen, onClose, archivedReports = [], onRestore, onPermanentDelete, loading = false }) {
  const [sortBy, setSortBy] = useState('date');

  if (!isOpen) return null;

  const sortedReports = [...archivedReports].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.deleted_at || b.created_at) - new Date(a.deleted_at || a.created_at);
    }
    return 0;
  });

  const calculateDaysUntilDeletion = (deletedAt) => {
    if (!deletedAt) return 30;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now - deleted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 8,
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '16px',
          }}
        >
          <h2 style={{ color: '#1b5e3f', margin: 0 }}>🗂️ Archived Reports</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Controls */}
        <div
          style={{
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="date">Recently Deleted</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Reports List */}
        {sortedReports.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666',
            }}
          >
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>No archived reports</p>
            <p style={{ fontSize: '14px', color: '#999' }}>Deleted reports will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedReports.map((report) => {
              const daysUntilDeletion = calculateDaysUntilDeletion(report.deleted_at);
              return (
                <div
                  key={report.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    background: 'rgba(255, 111, 0, 0.02)',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1b5e3f',
                      }}
                    >
                      {report.proposed_activity || report.organization_unit || `Record #${report.id}`}
                    </p>
                    <p
                      style={{
                        margin: '0 0 6px 0',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      Deleted: {new Date(report.deleted_at || report.created_at).toLocaleDateString('en-PH')}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: daysUntilDeletion <= 7 ? '#d32f2f' : '#ff6f00',
                        fontWeight: '600',
                      }}
                    >
                      ⏰ Permanent deletion in {daysUntilDeletion} days
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onRestore(report.id)}
                      disabled={loading}
                      style={{
                        padding: '8px 16px',
                        background: '#1b5e3f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: loading ? 0.6 : 1,
                        transition: 'background 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) e.target.style.background = '#145a36';
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) e.target.style.background = '#1b5e3f';
                      }}
                    >
                      <FiRefreshCw size={14} /> Restore
                    </button>
                    <button
                      onClick={() => onPermanentDelete(report.id)}
                      disabled={loading}
                      style={{
                        padding: '8px 16px',
                        background: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: loading ? 0.6 : 1,
                        transition: 'background 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) e.target.style.background = '#b71c1c';
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) e.target.style.background = '#d32f2f';
                      }}
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArchivedReportsModal;
