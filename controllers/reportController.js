const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Record = require('../models/Record');
const { getDateRange } = require('../utils/dateUtils');

// Create reports folder if doesn't exist
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Helper function to format time to 12-hour format
const formatTime12Hour = (time) => {
  if (!time) return '-';
  const [hours, minutes] = time.substring(0, 5).split(':');
  let hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  else if (hour === 0) hour = 12;
  return `${String(hour).padStart(2, '0')}:${minutes} ${ampm}`;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Helper: safe int
const toInt = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

// Helper: safe money
const toMoney = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (v) =>
  toMoney(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Normalize any date-like value to local YYYY-MM-DD
const toISODateLocal = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Strict post-filter to avoid timezone bleed (e.g., daily returning previous day)
const strictFilterByPeriod = (records, period, startDate, endDate) => {
  const p = String(period || '').toLowerCase();

  if (p === 'daily') {
    // EXACT day only
    return records.filter((r) => toISODateLocal(r.date) === startDate);
  }

  // weekly/monthly/custom => inclusive date range
  return records.filter((r) => {
    const d = toISODateLocal(r.date);
    return d && d >= startDate && d <= endDate;
  });
};

// Helper function: compute archived weeks from records in date range
const computeWeeksFromRecords = (records) => {
  const byWeek = new Map();
  const toISO = (d) => d.toISOString().split('T')[0];

  for (const r of records) {
    const d0 = new Date(r.date || r.activity_date);
    if (isNaN(d0)) continue;

    const day = d0.getDay();
    const start = new Date(d0);
    start.setHours(0, 0, 0, 0);
    start.setDate(d0.getDate() - day);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startDate = toISO(start);
    const endDate = toISO(end);
    const weekKey = `${startDate}_to_${endDate}`;

    const prev = byWeek.get(weekKey) || { weekKey, startDate, endDate, count: 0 };
    prev.count += 1;
    byWeek.set(weekKey, prev);
  }

  return Array.from(byWeek.values()).sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
};

/**
 * Generate PDF Report
 * GET /api/reports/pdf?period=daily|weekly|monthly|custom&week=1|2|3|4
 */
exports.generatePDFReport = async (req, res) => {
  try {
    const { period = 'daily', week, startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate, weekLabel } = getDateRange(period, customStart, customEnd, week);

    const rawRecords = await Record.getByDateRange(startDate, endDate);
    const records = strictFilterByPeriod(rawRecords, period, startDate, endDate);

    const doc = new PDFDocument({ size: 'A4', margin: 25, bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="activity-report-${period}-${Date.now()}.pdf"`
    );
    doc.pipe(res);

    // Title & header
    doc.fontSize(20).font('Helvetica-Bold').text('ACTIVITY REPORT', { align: 'center' }).moveDown(0.5);

    const periodLine =
      String(period).toLowerCase() === 'weekly' && weekLabel
        ? `Period: WEEKLY (${weekLabel})`
        : `Period: ${String(period).toUpperCase()}`;

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(periodLine, { align: 'center' })
      .text(`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`, { align: 'center' })
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
      .moveDown(1);

    // Summary
    const totalRecords = records.length;
    const uniqueOrganizations = new Set(records.map((r) => r.organization_unit)).size;
    const totalParticipants = records.reduce((sum, r) => sum + toInt(r.no_of_participants), 0);
    const totalEnvironmentalFee = records.reduce((sum, r) => sum + toMoney(r.environmental_fee), 0);

    doc.fontSize(14).font('Helvetica-Bold').text('Summary Statistics', { underline: true }).moveDown(0.5);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Total Activities: ${totalRecords}`)
      .text(`Total Unique Organizations: ${uniqueOrganizations}`)
      .text(`Total Participants: ${totalParticipants}`)
      .text(`Total Environmental Fee: ₱ ${formatMoney(totalEnvironmentalFee)}`)
      .moveDown(1.5);

    // Table
    const tableTop = doc.y;
    const cols = [25, 78, 135, 192, 249, 306, 365, 405, 445, 485];

    const drawHeader = (y) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1f3c88').rect(cols[0], y, 560, 18).fill();
      doc
        .fillColor('white')
        .text('Date', cols[0] + 2, y + 5, { width: 50 })
        .text('Org', cols[1] + 2, y + 5, { width: 55 })
        .text('Office', cols[2] + 2, y + 5, { width: 55 })
        .text('Activity', cols[3] + 2, y + 5, { width: 55 })
        .text('Venue', cols[4] + 2, y + 5, { width: 55 })
        .text('Act.Date', cols[5] + 2, y + 5, { width: 55 })
        .text('In', cols[6] + 2, y + 5, { width: 35 })
        .text('Out', cols[7] + 2, y + 5, { width: 35 })
        .text('Pax', cols[8] + 2, y + 5, { width: 35, align: 'center' })
        .text('Env Fee', cols[9] + 2, y + 5, { width: 95, align: 'right' });
    };

    drawHeader(tableTop);

    let currentY = tableTop + 22;
    doc.fontSize(7).font('Helvetica').fillColor('black');

    records.forEach((record, index) => {
      const rowHeight = 22;

      if (currentY + rowHeight > doc.page.height - 35) {
        doc.addPage();
        currentY = 25;
        drawHeader(currentY);
        currentY += 22;
        doc.fillColor('black').fontSize(7).font('Helvetica');
      }

      if (index % 2 === 0) doc.rect(cols[0], currentY, 560, rowHeight).fill('#f9fafb');

      doc
        .fillColor('black')
        .text(formatDate(record.date), cols[0] + 2, currentY + 3, { width: 50 })
        .text(record.organization_unit || '-', cols[1] + 2, currentY + 3, { width: 55 })
        .text(record.office_in_charge || '-', cols[2] + 2, currentY + 3, { width: 55 })
        .text(record.proposed_activity || '-', cols[3] + 2, currentY + 3, { width: 55 })
        .text(record.venue || '-', cols[4] + 2, currentY + 3, { width: 55 })
        .text(formatDate(record.activity_date), cols[5] + 2, currentY + 3, { width: 55 })
        .text(formatTime12Hour(record.time_in), cols[6] + 2, currentY + 3, { width: 35, align: 'center' })
        .text(formatTime12Hour(record.time_out), cols[7] + 2, currentY + 3, { width: 35, align: 'center' })
        .text(String(record.no_of_participants ?? '-'), cols[8] + 2, currentY + 3, {
          width: 35,
          align: 'center',
        })
        .text(`₱ ${formatMoney(record.environmental_fee)}`, cols[9] + 2, currentY + 3, {
          width: 95,
          align: 'right',
        });

      currentY += rowHeight;
    });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate Excel Report
 * GET /api/reports/excel?period=daily|weekly|monthly|custom&week=1|2|3|4
 */
exports.generateExcelReport = async (req, res) => {
  try {
    const { period = 'daily', week, startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate } = getDateRange(period, customStart, customEnd, week);

    const rawRecords = await Record.getByDateRange(startDate, endDate);
    const records = strictFilterByPeriod(rawRecords, period, startDate, endDate);

    const totalEnvironmentalFee = records.reduce((sum, r) => sum + toMoney(r.environmental_fee), 0);

    const rows = records.map((r) => ({
      Date: formatDate(r.date),
      Organization: r.organization_unit || '',
      Office: r.office_in_charge || '',
      Activity: r.proposed_activity || '',
      Venue: r.venue || '',
      ActivityDate: formatDate(r.activity_date),
      TimeIn: formatTime12Hour(r.time_in),
      TimeOut: formatTime12Hour(r.time_out),
      Participants: toInt(r.no_of_participants),
      EnvironmentalFee: toMoney(r.environmental_fee),
    }));

    rows.push({});
    rows.push({
      Date: 'TOTAL',
      EnvironmentalFee: totalEnvironmentalFee,
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    ws['!cols'] = [
      { wch: 18 }, // Date
      { wch: 22 }, // Org
      { wch: 22 }, // Office
      { wch: 25 }, // Activity
      { wch: 18 }, // Venue
      { wch: 18 }, // ActivityDate
      { wch: 12 }, // TimeIn
      { wch: 12 }, // TimeOut
      { wch: 14 }, // Participants
      { wch: 18 }, // EnvironmentalFee
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="activity-report-${period}-${Date.now()}.xlsx"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    return res.send(buffer);
  } catch (error) {
    console.error('Excel generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Report Summary
 * GET /api/reports/summary?period=daily|weekly|monthly|custom&week=1|2|3|4
 */
exports.getReportSummary = async (req, res) => {
  try {
    const { period = 'daily', week, startDate: customStart, endDate: customEnd } = req.query;
    const { startDate, endDate, weekLabel } = getDateRange(period, customStart, customEnd, week);

    const rawRecords = await Record.getByDateRange(startDate, endDate);
    const records = strictFilterByPeriod(rawRecords, period, startDate, endDate);

    const totalRecords = records.length;
    const uniqueOrganizations = new Set(records.map((r) => r.organization_unit)).size;
    const totalParticipants = records.reduce((sum, r) => sum + toInt(r.no_of_participants), 0);
    const totalEnvironmentalFee = records.reduce((sum, r) => sum + toMoney(r.environmental_fee), 0);

    return res.json({
      success: true,
      period,
      week: week ? Number(week) : null,
      weekLabel: weekLabel || null,
      startDate,
      endDate,
      summary: {
        totalActivities: totalRecords,
        uniqueOrganizations,
        totalParticipants,
        totalEnvironmentalFee,
      },
    });
  } catch (error) {
    console.error('Get report summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * List Archived Reports (weeks) - simple view
 * GET /api/reports/archived
 */
exports.listArchivedReports = async (req, res) => {
  try {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 365);

    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    const records = await Record.getByDateRange(startDate, endDate);
    const weeks = computeWeeksFromRecords(records);

    return res.json({
      success: true,
      startDate,
      endDate,
      archivedWeeks: weeks,
    });
  } catch (error) {
    console.error('List archived reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get Archived Weeks (alias endpoint)
 * GET /api/reports/archived/weeks
 */
exports.getArchivedWeeks = async (req, res) => {
  return exports.listArchivedReports(req, res);
};

/**
 * Generate Archived Week PDF Report
 * GET /api/reports/archived/week/:weekKey
 */
exports.generateArchivedWeekReport = async (req, res) => {
  try {
    let { weekKey } = req.params;
    let startDate, endDate;

    if (weekKey.includes('_to_')) {
      [startDate, endDate] = weekKey.split('_to_');
    } else {
      const date = new Date(weekKey);
      if (isNaN(date)) {
        return res.status(400).json({ success: false, error: 'Invalid week key format' });
      }
      const day = date.getDay();
      const start = new Date(date);
      start.setDate(date.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
      weekKey = `${startDate}_to_${endDate}`;
    }

    const records = await Record.getByDateRange(startDate, endDate);
    if (!records || records.length === 0) {
      return res.status(404).json({ success: false, error: 'No records found for this week' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 25, bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="archived-week-report-${weekKey}-${Date.now()}.pdf"`
    );
    doc.pipe(res);

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('ARCHIVED ACTIVITY REPORT', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Period: WEEKLY`, { align: 'center' })
      .text(`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`, { align: 'center' })
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
      .moveDown(1);

    const totalRecords = records.length;
    const uniqueOrganizations = new Set(records.map((r) => r.organization_unit)).size;
    const totalParticipants = records.reduce((sum, r) => sum + toInt(r.no_of_participants), 0);
    const totalEnvironmentalFee = records.reduce((sum, r) => sum + toMoney(r.environmental_fee), 0);

    doc.fontSize(14).font('Helvetica-Bold').text('Summary Statistics', { underline: true }).moveDown(0.5);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Total Activities: ${totalRecords}`)
      .text(`Total Unique Organizations: ${uniqueOrganizations}`)
      .text(`Total Participants: ${totalParticipants}`)
      .text(`Total Environmental Fee: ₱ ${formatMoney(totalEnvironmentalFee)}`)
      .moveDown(1.5);

    const tableTop = doc.y;
    const cols = [25, 78, 135, 192, 249, 306, 365, 405, 445, 485];

    const drawHeader = (y) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1f3c88').rect(cols[0], y, 560, 18).fill();
      doc
        .fillColor('white')
        .text('Date', cols[0] + 2, y + 5, { width: 50 })
        .text('Org', cols[1] + 2, y + 5, { width: 55 })
        .text('Office', cols[2] + 2, y + 5, { width: 55 })
        .text('Activity', cols[3] + 2, y + 5, { width: 55 })
        .text('Venue', cols[4] + 2, y + 5, { width: 55 })
        .text('Act.Date', cols[5] + 2, y + 5, { width: 55 })
        .text('In', cols[6] + 2, y + 5, { width: 35 })
        .text('Out', cols[7] + 2, y + 5, { width: 35 })
        .text('Pax', cols[8] + 2, y + 5, { width: 35, align: 'center' })
        .text('Env Fee', cols[9] + 2, y + 5, { width: 95, align: 'right' });
    };

    drawHeader(tableTop);

    let currentY = tableTop + 22;
    doc.fontSize(7).font('Helvetica').fillColor('black');

    records.forEach((record, index) => {
      const rowHeight = 22;

      if (currentY + rowHeight > doc.page.height - 35) {
        doc.addPage();
        currentY = 25;
        drawHeader(currentY);
        currentY += 22;
        doc.fillColor('black').fontSize(7).font('Helvetica');
      }

      if (index % 2 === 0) doc.rect(cols[0], currentY, 560, rowHeight).fill('#f9fafb');

      doc
        .fillColor('black')
        .text(formatDate(record.date), cols[0] + 2, currentY + 3, { width: 50 })
        .text(record.organization_unit || '-', cols[1] + 2, currentY + 3, { width: 55 })
        .text(record.office_in_charge || '-', cols[2] + 2, currentY + 3, { width: 55 })
        .text(record.proposed_activity || '-', cols[3] + 2, currentY + 3, { width: 55 })
        .text(record.venue || '-', cols[4] + 2, currentY + 3, { width: 55 })
        .text(formatDate(record.activity_date), cols[5] + 2, currentY + 3, { width: 55 })
        .text(formatTime12Hour(record.time_in), cols[6] + 2, currentY + 3, { width: 35, align: 'center' })
        .text(formatTime12Hour(record.time_out), cols[7] + 2, currentY + 3, { width: 35, align: 'center' })
        .text(String(record.no_of_participants ?? '-'), cols[8] + 2, currentY + 3, {
          width: 35,
          align: 'center',
        })
        .text(`₱ ${formatMoney(record.environmental_fee)}`, cols[9] + 2, currentY + 3, {
          width: 95,
          align: 'right',
        });

      currentY += rowHeight;
    });

    doc.end();
  } catch (error) {
    console.error('Generate archived week report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};