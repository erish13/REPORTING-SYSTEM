import React, { useEffect, useState } from 'react';
import { FiEye, FiX, FiClock } from 'react-icons/fi';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { reportsAPI } from '../services/api';
import '../styles/ReportGenerator.css';

function ReportGenerator({ period }) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // cleanup blob url on unmount / change
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handlePreviewPDF = async () => {
    try {
      setLoading(true);

      // �� get PDF blob from backend
      const pdfBlob = await reportsAPI.getPDF(period);

      // ✅ create preview blob url
      const nextUrl = URL.createObjectURL(pdfBlob);

      // revoke old one
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);

      setPdfUrl(nextUrl);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(error?.message || error?.response?.data?.error || 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfUrl) return;

    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `records-report-${period}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleClosePreview = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl('');
  };

  const handleDownloadExcel = async () => {
    try {
      setLoading(true);
      await reportsAPI.getExcel(period, '', '', '');
      alert('Excel downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert(error?.response?.data?.error || error?.message || 'Failed to download Excel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-generator">
      <h2>Generate Reports</h2>

      <div className="report-card">
        <h3>Report Information</h3>
        <p>
          <strong>Period:</strong> {period.charAt(0).toUpperCase() + period.slice(1)}
        </p>
        <p>
          <strong>Generated:</strong> {new Date().toLocaleString()}
        </p>
      </div>

      <div className="report-actions">
        <button className="btn btn-primary" onClick={handlePreviewPDF} disabled={loading}>
          {loading ? <><FiClock style={{ marginRight: '6px' }} /> Processing...</> : <><FiEye style={{ marginRight: '6px' }} /> Preview PDF</>}
        </button>

        <button className="btn btn-success" onClick={handleDownloadPDF} disabled={!pdfUrl || loading}>
          <FaFilePdf style={{ marginRight: '6px' }} /> Download PDF
        </button>

        <button className="btn btn-success" onClick={handleDownloadExcel} disabled={loading}>
          {loading ? <><FiClock style={{ marginRight: '6px' }} /> Processing...</> : <><FaFileExcel style={{ marginRight: '6px' }} /> Download Excel</>}
        </button>

        {pdfUrl && (
          <button className="btn btn-secondary" onClick={handleClosePreview} disabled={loading}>
            <FiX style={{ marginRight: '6px' }} /> Close Preview
          </button>
        )}
      </div>

      {pdfUrl && (
        <div className="pdf-preview">
          <iframe title="PDF Preview" src={pdfUrl} className="pdf-iframe" />
        </div>
      )}
    </div>
  );
}

export default ReportGenerator;