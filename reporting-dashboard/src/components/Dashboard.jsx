import React from 'react';
import '../styles/Dashboard.css';

function Dashboard({ summary, records }) {
  const getMonthName = () => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[new Date().getMonth()];
  };

  return (
    <div className="dashboard">
      <h2>Welcome to Your Dashboard</h2>
      <p>Overview for {getMonthName()} {new Date().getFullYear()}</p>

      <div className="summary-cards">
        <div className="card income">
          <h3>💵 Total Income</h3>
          <p className="amount">₱ {(summary?.income?.total || 0).toFixed(2)}</p>
          <span className="count">{summary?.income?.count || 0} transactions</span>
        </div>

        <div className="card expense">
          <h3>💸 Total Expense</h3>
          <p className="amount">₱ {(summary?.expense?.total || 0).toFixed(2)}</p>
          <span className="count">{summary?.expense?.count || 0} transactions</span>
        </div>

        <div className="card net">
          <h3>📊 Net Balance</h3>
          <p className={`amount ${(summary?.net || 0) >= 0 ? 'positive' : 'negative'}`}>
            ₱ {(summary?.net || 0).toFixed(2)}
          </p>
          <span className="count">
            {(summary?.net || 0) >= 0 ? '✅ Positive' : '⚠️ Negative'}
          </span>
        </div>
      </div>

      <div className="recent-transactions">
        <h3>📋 Recent Transactions</h3>
        {records.length === 0 ? (
          <p className="no-data">No transactions yet. Start by adding a new record!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 5).map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{record.category}</td>
                  <td className={record.type}>
                    {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                  </td>
                  <td className={`amount ${record.type}`}>
                    ₱ {parseFloat(record.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;