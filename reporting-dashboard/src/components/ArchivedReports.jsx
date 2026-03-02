import React, { useState, useEffect } from 'react';
import { recordsAPI } from '../services/api';
import '../styles/ArchivedReports.css';

function ArchivedReports() {
  const [archivedWeeks, setArchivedWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Load archived weeks on mount
  useEffect(() => {
    loadArchivedWeeks();
  }, []);

  const loadArchivedWeeks = async () => {
    try {
      setLoading(true);
      const response = await recordsAPI.getArchivedWeeks();
      setArchivedWeeks(response.data.weeks || []);
    } catch (error) {
      console.error('Error loading archived weeks:', error);
      alert('Failed to load archived weeks');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const downloadArchivedWeekPDF = async (weekKey) => {
    try {
      // Create a link to the archived week endpoint
      const encodedWeekKey = encodeURIComponent(weekKey);
      window.open(`http://localhost:3000/api/reports/archived/week/${encodedWeekKey}`, '_blank');
    } catch (error) {
      console.error('Error downloading archived week:', error);
      alert('Failed to download archived week report');
    }
  };

  const toggleExpanded = (weekKey) => {
    setExpanded(expanded === weekKey ? null : weekKey);
  };

  return (
    <div className="archived-reports-container">
      <h2>📦 Archived Weekly Reports</h2>
      <p className="subtitle">Access completed week reports and historical data</p>

      {loading ? (
        <div className="loading">Loading archived reports...</div>
      ) : archivedWeeks.length === 0 ? (
        <div className="no-data">
          <p>No archived reports yet. Weekly reports will appear here after each week ends.</p>
        </div>
      ) : (
        <div className="weeks-list">
          {archivedWeeks.map((week) => (
            <div key={week.archive_week_key} className="week-card">
              <div
                className="week-header"
                onClick={() => toggleExpanded(week.archive_week_key)}
              >
                <div className="week-info">
                  <h3 className="week-title">
                    📅{' '}
                    {formatDate(week.week_start)} - {formatDate(week.week_end)}
                  </h3>
                  <p className="week-meta">
                    {week.record_count} {week.record_count === 1 ? 'record' : 'records'}
                  </p>
                </div>
                <div className="week-actions">
                  <button
                    className="btn-download"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadArchivedWeekPDF(week.archive_week_key);
                    }}
                    title="Download as PDF"
                  >
                    📥 PDF
                  </button>
                  <span className={`expand-icon ${expanded === week.archive_week_key ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {expanded === week.archive_week_key && (
                <div className="week-details">
                  <div className="details-content">
                    <p>
                      <strong>Period:</strong> {formatDate(week.week_start)} to{' '}
                      {formatDate(week.week_end)}
                    </p>
                    <p>
                      <strong>Total Activities:</strong> {week.record_count}
                    </p>
                    <p>
                      <strong>Archive Key:</strong>{' '}
                      <code className="week-key">{week.archive_week_key}</code>
                    </p>
                    <div className="actions">
                      <button
                        className="btn-action btn-download-full"
                        onClick={() =>
                          downloadArchivedWeekPDF(week.archive_week_key)
                        }
                      >
                        📥 Download PDF Report
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {archivedWeeks.length > 0 && (
        <div className="refresh-section">
          <button className="btn-refresh" onClick={loadArchivedWeeks}>
            🔄 Refresh List
          </button>
        </div>
      )}
    </div>
  );
}

export default ArchivedReports;
