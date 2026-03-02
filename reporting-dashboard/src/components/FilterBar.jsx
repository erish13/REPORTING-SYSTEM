import React from 'react';
import '../styles/FilterBar.css';

function FilterBar({ onFilter, activePeriod }) {
  const periods = [
    { value: 'daily', label: '📅 Today' },
    { value: 'weekly', label: '📆 This Week' },
    { value: 'monthly', label: '📊 This Month' },
  ];

  return (
    <div className="filter-bar">
      <h2>🔍 Filter Records</h2>
      <div className="filter-buttons">
        {periods.map((period) => (
          <button
            key={period.value}
            className={`filter-btn ${activePeriod === period.value ? 'active' : ''}`}
            onClick={() => onFilter(period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FilterBar;