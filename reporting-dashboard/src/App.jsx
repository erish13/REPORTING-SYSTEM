import React, { useState, useEffect } from 'react';
import RecordForm from './components/RecordForm';
import RecordTable from './components/RecordTable';
import FilterBar from './components/FilterBar';
import ReportGenerator from './components/ReportGenerator';
// Removed: ArchivedReports import
import LoginForm from './components/LoginForm';
import { recordsAPI } from './services/api';
import './App.css';

function App() {
  const [records, setRecords] = useState([]);
  const [_summary, setSummary] = useState({
    income: { total: 0 },
    expense: { total: 0 },
    net: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('daily');
  // Removed: activeTab state since Archived tab is removed
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setRecords([]);
  };

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

  const loadSummary = async () => {
    try {
      const response = await recordsAPI.getSummary();
      setSummary(
        response.data.summary || {
          income: { total: 0 },
          expense: { total: 0 },
          net: 0,
        }
      );
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleFilter = async (period) => {
    try {
      setLoading(true);
      setFilterPeriod(period);
      const response = await recordsAPI.filter(period);
      setRecords(response.data.data || []);
      setSummary({
        income: response?.data?.summary?.income || { total: 0 },
        expense: response?.data?.summary?.expense || { total: 0 },
        net: response?.data?.summary?.net || 0,
      });
    } catch (error) {
      console.error('Error filtering records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (data) => {
    try {
      await recordsAPI.create(data);
      alert('Record created successfully!');
      loadRecords();
      loadSummary();
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to create record');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await recordsAPI.delete(id);
        alert('Record deleted successfully!');
        loadRecords();
        loadSummary();
      } catch {
        alert('Failed to delete record');
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRecords();
      loadSummary();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🌿 Environmental Guarantee and Activity Permit</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tab-button active" type="button">
              📊 Dashboard
            </button>
            <button className="tab-button" onClick={logout} type="button">
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <>
          <aside className="sidebar">
            <RecordForm onSubmit={handleCreateRecord} />
          </aside>
          <div className="content-area">
            <FilterBar onFilter={handleFilter} activePeriod={filterPeriod} />
            <RecordTable records={records} loading={loading} onDelete={handleDeleteRecord} />
          </div>
          <aside className="sidebar right-sidebar">
            <ReportGenerator period={filterPeriod} />
          </aside>
        </>
      </main>

      <footer className="footer">
        <p>Total Records: {records.length} | Last Updated: {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
}

export default App;