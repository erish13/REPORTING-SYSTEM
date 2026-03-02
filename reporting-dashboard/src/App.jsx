import React, { useState, useEffect } from 'react';
import RecordForm from './components/RecordForm';
import RecordTable from './components/RecordTable';
import FilterBar from './components/FilterBar';
import ReportGenerator from './components/ReportGenerator';
import ArchivedReports from './components/ArchivedReports';
import { recordsAPI } from './services/api';
import './App.css';

function App() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    income: { total: 0 },
    expense: { total: 0 },
    net: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('daily');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'archived'

  // Load all records
  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await recordsAPI.getAll();
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load summary
  const loadSummary = async () => {
    try {
      const response = await recordsAPI.getSummary();
      setSummary(response.data.summary || {
        income: { total: 0 },
        expense: { total: 0 },
        net: 0,
      });
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  // Apply filter
  const handleFilter = async (period) => {
    try {
      setLoading(true);
      setFilterPeriod(period);
      const response = await recordsAPI.filter(period);
      setRecords(response.data.data || []);
      setSummary({
        income: response.data.summary.income || 0,
        expense: response.data.summary.expense || 0,
        net: response.data.summary.net || 0,
      });
    } catch (error) {
      console.error('Error filtering records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create record
  const handleCreateRecord = async (data) => {
    try {
      await recordsAPI.create(data);
      alert('Record created successfully!');
      loadRecords();
      loadSummary();
    } catch (error) {
      console.error('Error creating record:', error);
      alert(error.response?.data?.error || 'Failed to create record');
    }
  };

  // Delete record
  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await recordsAPI.delete(id);
        alert('Record deleted successfully!');
        loadRecords();
        loadSummary();
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadRecords();
    loadSummary();
  }, []);

  // Safe format function
  const formatMoney = (value) => {
    if (!value || isNaN(value)) return '0.00';
    return parseFloat(value).toFixed(2);
  };

  // Safe net value
  const netValue = parseFloat(summary?.net) || 0;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>🌿 Environmental Guarantee and Activity Permit</h1>
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`tab-button ${activeTab === 'archived' ? 'active' : ''}`}
              onClick={() => setActiveTab('archived')}
            >
              📦 Archived Reports
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'dashboard' ? (
          <>
            {/* Left Sidebar */}
            <aside className="sidebar">
              <RecordForm onSubmit={handleCreateRecord} />
            </aside>

            {/* Center Content */}
            <div className="content-area">
              <FilterBar onFilter={handleFilter} activePeriod={filterPeriod} />
              <RecordTable
                records={records}
                loading={loading}
                onDelete={handleDeleteRecord}
              />
            </div>

            {/* Right Sidebar */}
            <aside className="sidebar right-sidebar">
              <ReportGenerator period={filterPeriod} />
            </aside>
          </>
        ) : (
          /* Archived Reports Tab */
          <div className="archived-reports-full-width">
            <ArchivedReports />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Total Records: {records.length} | Last Updated: {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
}

export default App;