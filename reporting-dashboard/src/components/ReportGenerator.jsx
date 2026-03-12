import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import '../styles/ReportGenerator.css';

function ReportGenerator({ period }) {
  const [loading, setLoading] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      await reportsAPI.getPDF(period, '', '', '');
      alert('📄 PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(error?.response?.data?.error || 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setLoading(true);
      await reportsAPI.getExcel(period, '', '', '');
      alert('📊 Excel downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert(error?.response?.data?.error || 'Failed to download Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-generator">
      <h2>📄 Generate Reports</h2>

      <div className="report-card">
        <h3>📋 Report Information</h3>
        <p><strong>Period:</strong> {period.charAt(0).toUpperCase() + period.slice(1)}</p>
        <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
      </div>

      <div className="report-actions">
        <button className="btn btn-primary" onClick={handleDownloadPDF} disabled={loading}>
          {loading ? '⏳ Processing...' : '📥 Download PDF'}
        </button>

        <button className="btn btn-success" onClick={handleDownloadExcel} disabled={loading}>
          {loading ? '⏳ Processing...' : '📥 Download Excel'}
        </button>
      </div>
    </div>
  );
}

export default ReportGenerator;