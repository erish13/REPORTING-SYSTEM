import React from 'react';
import ReportGenerator from './ReportGenerator';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-tabs">
        <button className="active" type="button">
          📊 Dashboard
        </button>
      </div>

      <div className="dashboard-content">
        <ReportGenerator />
      </div>
    </div>
  );
}

export default Dashboard;