/**
 * Get date range based on period
 * @param {string} period - daily, weekly, monthly, custom
 * @param {string} startDate - optional custom start date
 * @param {string} endDate - optional custom end date
 * @returns {object} { startDate, endDate }
 */
function getDateRange(period, startDate, endDate) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  let start, end;

  switch (period.toLowerCase()) {
    case 'daily':
      start = new Date(year, month, date);
      end = new Date(year, month, date, 23, 59, 59);
      break;

    case 'weekly':
      const firstDay = date - today.getDay();
      start = new Date(year, month, firstDay);
      end = new Date(year, month, firstDay + 6, 23, 59, 59);
      break;

    case 'monthly':
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0, 23, 59, 59);
      break;

    case 'custom':
      if (!startDate || !endDate) {
        throw new Error('Custom period requires startDate and endDate');
      }
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59);
      break;

    default:
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0, 23, 59, 59);
  }

  // Format as YYYY-MM-DD for database
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

module.exports = { getDateRange };