import React from 'react';
import { FiFilter, FiCalendar } from 'react-icons/fi';
import '../styles/FilterBar.css';

function FilterBar({ onFilter, activePeriod }) {
  const periods = [
    { value: 'daily', label: 'Today', icon: FiCalendar },
    { value: 'weekly', label: 'This Week', icon: FiCalendar },
    { value: 'monthly', label: 'This Month', icon: FiCalendar },
  ];

  return (
    <div className="filter-bar">
      <h2><FiFilter style={{ marginRight: '8px' }} /> Filter Records</h2>
      <div className="filter-buttons">
        {periods.map((period) => {
          const IconComponent = period.icon;
          return (
            <button
              key={period.value}
              className={`filter-btn ${activePeriod === period.value ? 'active' : ''}`}
              onClick={() => onFilter(period.value)}
            >
              <IconComponent style={{ marginRight: '4px' }} /> {period.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FilterBar;