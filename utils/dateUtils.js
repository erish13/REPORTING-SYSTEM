/**
 * Get date range based on period
 * @param {string} period - daily, weekly, monthly, custom
 * @param {string} startDate - optional custom start date
 * @param {string} endDate - optional custom end date
 * @param {number|string} week - optional week number (1-4) for weekly
 * @returns {object} { startDate, endDate, weekLabel? }
 */
function getDateRange(period, startDate, endDate, week) {
  const now = new Date();
  const p = String(period || 'daily').toLowerCase();

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getWeekBoundsInMonth = (year, month, weekNo) => {
    // 4 weeks per month:
    // Week 1 => day 1-7
    // Week 2 => day 8-14
    // Week 3 => day 15-21
    // Week 4 => day 22-endOfMonth
    const monthEndDay = new Date(year, month + 1, 0).getDate();
    const ws = (weekNo - 1) * 7 + 1;
    const we = weekNo === 4 ? monthEndDay : Math.min(ws + 6, monthEndDay);

    return {
      start: new Date(year, month, ws),
      end: new Date(year, month, we),
      weekLabel: `Week ${weekNo}`,
    };
  };

  let start;
  let end;
  let weekLabel = null;

  switch (p) {
    case 'daily': {
      // Today only (auto reset every day)
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    }

    case 'weekly': {
      // Default: current week-of-month, but allow override via ?week=1..4
      const currentWeek = Math.min(Math.ceil(now.getDate() / 7), 4);
      const selectedWeek = week ? Math.max(1, Math.min(parseInt(week, 10) || 1, 4)) : currentWeek;

      const bounds = getWeekBoundsInMonth(now.getFullYear(), now.getMonth(), selectedWeek);
      start = bounds.start;
      end = bounds.end;
      weekLabel = bounds.weekLabel;
      break;
    }

    case 'monthly': {
      // Entire current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    }

    case 'custom': {
      if (!startDate || !endDate) {
        throw new Error('Custom period requires startDate and endDate');
      }
      start = new Date(startDate);
      end = new Date(endDate);
      break;
    }

    default: {
      // Fallback to daily
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    }
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    weekLabel,
  };
}

module.exports = { getDateRange };