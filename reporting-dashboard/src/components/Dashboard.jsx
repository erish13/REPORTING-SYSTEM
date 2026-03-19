import React, { useEffect, useState } from 'react';
import { MdDashboard, MdAssignment, MdArchive, MdLogout, MdPerson } from 'react-icons/md';
import { recordsAPI, reportsAPI } from '../services/api';
import RecordTable from './RecordTable';
import RecordForm from './RecordForm';
import '../styles/Dashboard.css';

function Dashboard({ onLogout }) {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    console.log('Date state changed:', { dateFrom, dateTo });
  }, [dateFrom, dateTo]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await recordsAPI.getAll();
      console.log('API Response:', res);
      const recordsData = res.data?.data || res.data || [];
      setRecords(recordsData);
      setFilteredRecords(recordsData);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (data) => {
    try {
      await recordsAPI.create(data);
      alert('Record created successfully!');
      setShowAddModal(false);
      fetchRecords();
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to create record');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await recordsAPI.delete(id);
        alert('Record deleted successfully!');
        fetchRecords();
      } catch (error) {
        alert('Failed to delete record');
      }
    }
  };

  const handleEditRecord = (id) => {
    const record = records.find((r) => r.id === id);
    if (record) {
      setEditingRecord(record);
      setShowEditModal(true);
    }
  };

  const handleUpdateRecord = async (data) => {
    try {
      await recordsAPI.update(editingRecord.id, data);
      alert('Record updated successfully!');
      setShowEditModal(false);
      setEditingRecord(null);
      fetchRecords();
    } catch (error) {
      alert(error?.response?.data?.error || 'Failed to update record');
    }
  };

  const handleFilterByDate = () => {
    console.log('handleFilterByDate called');
    console.log('Current state - dateFrom:', JSON.stringify(dateFrom), 'dateTo:', JSON.stringify(dateTo));
    console.log('dateFrom truthy?', !!dateFrom, 'dateTo truthy?', !!dateTo);
    
    if (!dateFrom || !dateTo) {
      console.log('Validation failed: missing dates');
      alert('Please select both start and end dates');
      return;
    }

    console.log('Filter applied with dates:', { dateFrom, dateTo });
    alert(`Filter set: ${dateFrom} to ${dateTo}`);

    const filtered = records.filter((record) => {
      const activityStart = record.activity_date_from ? new Date(record.activity_date_from) : null;
      const activityEnd = record.activity_date_to ? new Date(record.activity_date_to) : null;
      const filterStart = new Date(dateFrom);
      const filterEnd = new Date(dateTo);
      
      // Record falls within filter range if:
      // activity starts before or on filter end AND activity ends after or on filter start
      if (activityStart && activityEnd) {
        return activityStart <= filterEnd && activityEnd >= filterStart;
      }
      return false;
    });

    setFilteredRecords(filtered);
    setShowFilterModal(false);
  };

  const handleResetFilter = () => {
    setDateFrom('');
    setDateTo('');
    setFilteredRecords(records);
  };

  const handleDownloadPDF = async () => {
    console.log('PDF download clicked. Current state:', { dateFrom, dateTo, recordsCount: filteredRecords.length });
    
    if (!dateFrom || !dateTo) {
      alert('Please select both start and end dates');
      return;
    }

    if (filteredRecords.length === 0) {
      alert('No records to download. Apply filter first.');
      return;
    }

    try {
      setDownloadLoading(true);
      console.log('Downloading PDF with filtered records:', filteredRecords.length);
      const pdfBlob = await reportsAPI.getPDF('custom', dateFrom, dateTo);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF: ' + (error?.message || 'Unknown error'));
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    console.log('Excel download clicked. Current state:', { dateFrom, dateTo });
    
    if (!dateFrom || !dateTo) {
      alert('Please select both start and end dates');
      return;
    }
    try {
      setDownloadLoading(true);
      console.log('Downloading Excel with dates:', { dateFrom, dateTo });
      await reportsAPI.getExcel('custom', dateFrom, dateTo, '');
      alert('Excel downloaded successfully!');
    } catch (error) {
      console.error('Excel download error:', error);
      alert('Failed to download Excel: ' + (error?.message || 'Unknown error'));
    } finally {
      setDownloadLoading(false);
    }
  };

  // Modal Backdrop Component
  const Modal = ({ isOpen, title, children, onClose }) => {
    if (!isOpen) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 30,
            maxWidth: 600,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, color: '#1b5e3f', fontSize: 22 }}>{title}</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#999',
              }}
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarExpanded ? 280 : 80,
          background: '#1b5e3f',
          color: 'white',
          padding: '20px',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
          overflowY: 'auto',
          transition: 'width 0.3s ease',
        }}
      >
        <div
          style={{
            marginBottom: 30,
            paddingBottom: 20,
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
          }}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: sidebarExpanded ? 'row' : 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: 30, 
            gap: sidebarExpanded ? 12 : 8
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <MdPerson size={40} style={{ flexShrink: 0 }} />
              {sidebarExpanded && (
                <div style={{ fontSize: 12, fontWeight: 600 }}>Admin</div>
              )}
            </div>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: 18,
                transition: 'all 0.3s ease',
                flexShrink: 0,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: sidebarExpanded ? 0 : 4,
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
              }}
              title={sidebarExpanded ? 'Collapse' : 'Expand'}
            >
              {sidebarExpanded ? '<' : '>'}
            </button>
          </div>
          {sidebarExpanded && (
            <div>
              <h3 style={{ margin: '8px 0 0 0', fontSize: 14, fontWeight: 600 }}>
                Reporting
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 11, opacity: 0.8 }}>
                Dashboard
              </p>
            </div>
          )}
        </div>

        <nav>
          <div
            onClick={() => setActiveMenu('dashboard')}
            style={{
              padding: '12px 16px',
              marginBottom: 8,
              borderRadius: 6,
              cursor: 'pointer',
              background:
                activeMenu === 'dashboard'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'transparent',
              transition: 'background 0.3s',
              fontSize: sidebarExpanded ? 15 : 12,
              fontWeight: activeMenu === 'Dashboard' ? 600 : 500,
              textAlign: sidebarExpanded ? 'left' : 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (activeMenu !== 'dashboard') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeMenu !== 'dashboard') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            title="Dashboard"
          >
            <MdDashboard size={20} style={{ flexShrink: 0 }} /> {sidebarExpanded && 'Dashboard'}
          </div>

          <div
            onClick={() => setActiveMenu('reports')}
            style={{
              padding: '12px 16px',
              marginBottom: 8,
              borderRadius: 6,
              cursor: 'pointer',
              background:
                activeMenu === 'reports'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'transparent',
              transition: 'background 0.3s',
              fontSize: sidebarExpanded ? 15 : 12,
              fontWeight: activeMenu === 'reports' ? 600 : 500,
              textAlign: sidebarExpanded ? 'left' : 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (activeMenu !== 'reports') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeMenu !== 'reports') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            title="Reports"
          >
            <MdAssignment size={20} style={{ flexShrink: 0 }} /> {sidebarExpanded && 'Reports'}
          </div>

          <div
            onClick={() => setActiveMenu('archived')}
            style={{
              padding: '12px 16px',
              marginBottom: 8,
              borderRadius: 6,
              cursor: 'pointer',
              background:
                activeMenu === 'archived'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'transparent',
              transition: 'background 0.3s',
              fontSize: sidebarExpanded ? 15 : 12,
              fontWeight: activeMenu === 'archived' ? 600 : 500,
              textAlign: sidebarExpanded ? 'left' : 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (activeMenu !== 'archived') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeMenu !== 'archived') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            title="Archived"
          >
            <MdArchive size={20} style={{ flexShrink: 0 }} /> {sidebarExpanded && 'Archived'}
          </div>
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 20,
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: sidebarExpanded ? 14 : 12,
              fontWeight: 600,
              transition: 'background 0.3s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarExpanded ? 'flex-start' : 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 102, 102, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            title="Logout"
          >
            <MdLogout size={20} style={{ flexShrink: 0 }} /> {sidebarExpanded && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '30px',
          overflowY: 'auto',
          transition: 'margin 0.3s ease',
        }}
      >
        {activeMenu === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 30 }}>
              <h1 style={{ margin: '0 0 8px 0', color: '#1b5e3f', fontSize: 32 }}>
                Dashboard
              </h1>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                Welcome back! Here's your system data.
              </p>
            </div>

            <div
              style={{
                background: 'white',
                borderRadius: 8,
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
            >
              <RecordTable records={records} loading={loading} />
            </div>
          </div>
        )}

        {activeMenu === 'reports' && (
          <div>
            <div style={{ marginBottom: 30 }}>
              <h1 style={{ margin: '0 0 8px 0', color: '#1b5e3f', fontSize: 32 }}>
                Reports
              </h1>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                Manage records and generate reports.
              </p>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                padding: '20px',
                marginBottom: 30,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '12px 24px',
                  background: '#1b5e3f',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'background 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#145a36';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#1b5e3f';
                }}
              >
                ➕ Add Record
              </button>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowFilterModal(true)}
                  style={{
                    padding: '12px 24px',
                    background: '#0277bd',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'background 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#01579b';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#0277bd';
                  }}
                >
                  🔍 Filter
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadLoading}
                  style={{
                    padding: '12px 24px',
                    background: downloadLoading ? '#ccc' : '#d32f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: downloadLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'background 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (!downloadLoading) e.target.style.background = '#b71c1c';
                  }}
                  onMouseLeave={(e) => {
                    if (!downloadLoading) e.target.style.background = '#d32f2f';
                  }}
                >
                  📄 {downloadLoading ? 'Downloading...' : 'PDF'}
                </button>

                <button
                  onClick={handleDownloadExcel}
                  disabled={downloadLoading}
                  style={{
                    padding: '12px 24px',
                    background: downloadLoading ? '#ccc' : '#2e7d32',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: downloadLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'background 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (!downloadLoading) e.target.style.background = '#1b5e20';
                  }}
                  onMouseLeave={(e) => {
                    if (!downloadLoading) e.target.style.background = '#2e7d32';
                  }}
                >
                  📊 {downloadLoading ? 'Downloading...' : 'Excel'}
                </button>
              </div>
            </div>

            {/* Records Table */}
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              }}
            >
              <h2 style={{ margin: '0 0 20px 0', color: '#1b5e3f', fontSize: 20 }}>
                📋 Records ({filteredRecords.length})
              </h2>
              <RecordTable records={filteredRecords} loading={loading} onDelete={handleDeleteRecord} onEdit={handleEditRecord} />
            </div>

            {/* Add Record Modal */}
            <Modal isOpen={showAddModal} title="➕ Add New Record" onClose={() => setShowAddModal(false)}>
              <RecordForm onSubmit={handleCreateRecord} />
            </Modal>

            {/* Edit Record Modal */}
            <Modal isOpen={showEditModal} title="✏️ Edit Record" onClose={() => setShowEditModal(false)}>
              {editingRecord && (
                <RecordForm onSubmit={handleUpdateRecord} initialData={editingRecord} />
              )}
            </Modal>

            {/* Filter Modal */}
            <Modal isOpen={showFilterModal} title="🔍 Filter Records by Date" onClose={() => setShowFilterModal(false)}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  background: '#f0f0f0', 
                  padding: '12px', 
                  borderRadius: '6px',
                  marginBottom: 16,
                  fontSize: 12,
                  color: '#666'
                }}>
                  <strong>Debug Info:</strong><br/>
                  From Date Value: <code>{JSON.stringify(dateFrom)}</code><br/>
                  To Date Value: <code>{JSON.stringify(dateTo)}</code>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: '#333', fontWeight: 500, fontSize: 14 }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      console.log('From date changed:', e.target.value);
                      setDateFrom(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'Arial, sans-serif',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1b5e3f';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                    }}
                  />
                  <small style={{ display: 'block', marginTop: 4, color: '#999', fontSize: 12 }}>
                    Format: YYYY-MM-DD (e.g., 2026-03-19)
                  </small>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, color: '#333', fontWeight: 500, fontSize: 14 }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      console.log('To date changed:', e.target.value);
                      setDateTo(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: 10,
                      border: '1.5px solid #e0e0e0',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'Arial, sans-serif',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1b5e3f';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                    }}
                  />
                  <small style={{ display: 'block', marginTop: 4, color: '#999', fontSize: 12 }}>
                    Format: YYYY-MM-DD (e.g., 2026-03-19)
                  </small>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleFilterByDate}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      background: '#1b5e3f',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      transition: 'background 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#145a36';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#1b5e3f';
                    }}
                  >
                    Apply Filter
                  </button>
                  <button
                    onClick={handleResetFilter}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      background: '#f0f0f0',
                      color: '#333',
                      border: '1px solid #e0e0e0',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                      transition: 'background 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#e0e0e0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#f0f0f0';
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {activeMenu === 'archived' && (
          <div
            style={{
              background: 'white',
              borderRadius: 8,
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            }}
          >
            <h2 style={{ color: '#1b5e3f' }}>🗂️ Archived Records</h2>
            <p style={{ color: '#666' }}>Archived section coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;