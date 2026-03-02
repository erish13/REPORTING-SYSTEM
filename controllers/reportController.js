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
  let hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';

  if (hour > 12) {
    hour = hour - 12;
  } else if (hour === 0) {
    hour = 12;
  }

  return `${String(hour).padStart(2, '0')}:${minutes} ${ampm}`;
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Generate PDF Report
 * GET /api/reports/pdf?period=daily
 */
exports.generatePDFReport = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    console.log(`Generating PDF for period: ${period}`);

    // Get date range
    const { startDate, endDate } = getDateRange(period);

    console.log(`Date range: ${startDate} to ${endDate}`);

    // Fetch records
    const records = await Record.getByDateRange(startDate, endDate);

    console.log(`Found ${records.length} records for PDF`);

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 30,
      bufferPages: true,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="activity-report-${period}-${Date.now()}.pdf"`
    );

    // Pipe to response
    doc.pipe(res);

    // ===== TITLE =====
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('ACTIVITY REPORT', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Period: ${period.toUpperCase()}`, { align: 'center' })
      .text(`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`, {
        align: 'center',
      })
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
      .moveDown(1);

    // ===== SUMMARY =====
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Summary Statistics', { underline: true })
      .moveDown(0.5);

    const totalRecords = records.length;
    const uniqueOrganizations = new Set(
      records.map((r) => r.organization_unit)
    ).size;
    const totalParticipants = records.reduce(
      (sum, r) => sum + parseInt(r.no_of_participants || 0),
      0
    );

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Total Activities: ${totalRecords}`)
      .text(`Total Unique Organizations: ${uniqueOrganizations}`)
      .text(`Total Participants: ${totalParticipants}`)
      .moveDown(2);

    // ===== TABLE HEADER =====
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Detailed Activity Records', { underline: true })
      .moveDown(1);

    if (records.length === 0) {
      doc
        .fontSize(11)
        .font('Helvetica')
        .text('No records found for this period.');
      doc.end();
      return;
    }

    // ===== TABLE DATA =====
    const tableTop = doc.y;
    const col1X = 30;
    const col2X = 100;
    const col3X = 160;
    const col4X = 220;
    const col5X = 280;
    const col6X = 340;
    const col7X = 400;
    const col8X = 450;
    const col9X = 500;

    // Draw header
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1f3c88')
      .rect(col1X, tableTop, 570, 20)
      .fill();

    doc
      .fillColor('white')
      .text('Date', col1X + 2, tableTop + 5, { width: 65 })
      .text('Organization', col2X + 2, tableTop + 5, { width: 55 })
      .text('Office', col3X + 2, tableTop + 5, { width: 55 })
      .text('Activity', col4X + 2, tableTop + 5, { width: 55 })
      .text('Venue', col5X + 2, tableTop + 5, { width: 55 })
      .text('Date', col6X + 2, tableTop + 5, { width: 55 })
      .text('In', col7X + 2, tableTop + 5, { width: 45 })
      .text('Out', col8X + 2, tableTop + 5, { width: 45 })
      .text('Pax', col9X + 2, tableTop + 5, { width: 45 });

    let currentY = tableTop + 25;

    doc.fontSize(8).font('Helvetica').fillColor('black');

    // Draw data rows
    records.forEach((record, index) => {
      const rowHeight = 25;

      // Check if we need a new page
      if (currentY + rowHeight > doc.page.height - 40) {
        doc.addPage();
        currentY = 30;

        // Redraw header on new page
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1f3c88')
          .rect(col1X, currentY, 570, 20)
          .fill();

        doc
          .fillColor('black')
          .fontSize(8)
          .font('Helvetica')
          .text('Date', col1X + 2, currentY + 5, { width: 65 })
          .text('Organization', col2X + 2, currentY + 5, { width: 55 })
          .text('Office', col3X + 2, currentY + 5, { width: 55 })
          .text('Activity', col4X + 2, currentY + 5, { width: 55 })
          .text('Venue', col5X + 2, currentY + 5, { width: 55 })
          .text('Date', col6X + 2, currentY + 5, { width: 55 })
          .text('In', col7X + 2, currentY + 5, { width: 45 })
          .text('Out', col8X + 2, currentY + 5, { width: 45 })
          .text('Pax', col9X + 2, currentY + 5, { width: 45 });

        currentY += 25;
      }

      // Alternating background
      if (index % 2 === 0) {
        doc.rect(col1X, currentY, 570, rowHeight).fill('#f9fafb');
      }

      doc.fillColor('black');

      // Draw row data
      doc
        .fontSize(8)
        .text(formatDate(record.date), col1X + 2, currentY + 3, { width: 65 })
        .text(record.organization_unit, col2X + 2, currentY + 3, { width: 55 })
        .text(record.office_in_charge, col3X + 2, currentY + 3, { width: 55 })
        .text(record.proposed_activity, col4X + 2, currentY + 3, { width: 55 })
        .text(record.venue, col5X + 2, currentY + 3, { width: 55 })
        .text(formatDate(record.activity_date), col6X + 2, currentY + 3, {
          width: 55,
        })
        .text(formatTime12Hour(record.time_in), col7X + 2, currentY + 3, {
          width: 45,
          align: 'center',
        })
        .text(formatTime12Hour(record.time_out), col8X + 2, currentY + 3, {
          width: 45,
          align: 'center',
        })
        .text(record.no_of_participants, col9X + 2, currentY + 3, {
          width: 45,
          align: 'center',
        });

      currentY += rowHeight;
    });

    // Footer
    
    doc.end();

    console.log('PDF generated successfully');
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate Excel Report
 * GET /api/reports/excel?period=daily
 */
exports.generateExcelReport = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    console.log(`Generating Excel for period: ${period}`);

    // Get date range
    const { startDate, endDate } = getDateRange(period);

    // Fetch records
    const records = await Record.getByDateRange(startDate, endDate);

    console.log(`Found ${records.length} records for Excel`);

    // Prepare data
    const data = [
      ['ACTIVITY REPORT'],
      [`Period: ${period.toUpperCase()}`],
      [`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['SUMMARY STATISTICS'],
      ['Total Activities', records.length],
      [
        'Total Unique Organizations',
        new Set(records.map((r) => r.organization_unit)).size,
      ],
      [
        'Total Participants',
        records.reduce((sum, r) => sum + parseInt(r.no_of_participants || 0), 0),
      ],
      [],
      ['DETAILED ACTIVITY RECORDS'],
      [
        'Date',
        'Organization/Unit',
        'Office in Charge',
        'Proposed Activity',
        'Venue',
        'Activity Date',
        'Time In',
        'Time Out',
        'No. of Participants',
      ],
      ...records.map((r) => [
        formatDate(r.date),
        r.organization_unit,
        r.office_in_charge,
        r.proposed_activity,
        r.venue,
        formatDate(r.activity_date),
        formatTime12Hour(r.time_in),
        formatTime12Hour(r.time_out),
        r.no_of_participants,
      ]),
    ];

    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Report');

    // Set column widths
    ws['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 18 },
      { wch: 25 },
      { wch: 18 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
    ];

    // Generate filename
    const filename = `activity-report-${period}-${Date.now()}.xlsx`;
    const filepath = path.join(reportsDir, filename);

    // Write file
    XLSX.writeFile(wb, filepath);

    console.log('Excel file created at:', filepath);

    // Send file
    res.download(filepath, filename, (err) => {
      if (err) console.error('Download error:', err);
      // Cleanup
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 1000);
    });
  } catch (error) {
    console.error('Excel generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Report Summary
 * GET /api/reports/summary?period=daily
 */
exports.getReportSummary = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    const { startDate, endDate } = getDateRange(period);

    const records = await Record.getByDateRange(startDate, endDate);

    res.status(200).json({
      success: true,
      summary: {
        total_records: records.length,
        total_participants: records.reduce(
          (sum, r) => sum + parseInt(r.no_of_participants || 0),
          0
        ),
      },
      records,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Archive report to file (used by scheduled jobs)
 * period: 'daily' | 'weekly' | 'monthly' or when startDate/endDate provided, will use those
 */
exports.archiveReport = async (period, options = {}) => {
  try {
    const { startDate: optStart, endDate: optEnd } = options;

    const { startDate, endDate } = optStart && optEnd ? { startDate: optStart, endDate: optEnd } : getDateRange(period || 'weekly');

    // Fetch records
    const records = await Record.getByDateRange(startDate, endDate);

    // Prepare filename
    const filename = `activity-report-${period || 'weekly'}-${startDate}_to_${endDate}-${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);

    // Create PDF and write to file
    const doc = new PDFDocument({ size: 'A4', margin: 30, bufferPages: true });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Title & header
    doc.fontSize(20).font('Helvetica-Bold').text('ACTIVITY REPORT', { align: 'center' }).moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Period: ${period ? period.toUpperCase() : 'WEEKLY'}`, { align: 'center' })
      .text(`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`, { align: 'center' })
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' }).moveDown(1);

    // Summary
    doc.fontSize(14).font('Helvetica-Bold').text('Summary Statistics', { underline: true }).moveDown(0.5);
    const totalRecords = records.length;
    const uniqueOrganizations = new Set(records.map((r) => r.organization_unit)).size;
    const totalParticipants = records.reduce((sum, r) => sum + parseInt(r.no_of_participants || 0), 0);
    doc.fontSize(11).font('Helvetica').text(`Total Activities: ${totalRecords}`)
      .text(`Total Unique Organizations: ${uniqueOrganizations}`)
      .text(`Total Participants: ${totalParticipants}`).moveDown(2);

    // Table header
    doc.fontSize(14).font('Helvetica-Bold').text('Detailed Activity Records', { underline: true }).moveDown(1);

    if (records.length === 0) {
      doc.fontSize(11).font('Helvetica').text('No records found for this period.');
      doc.end();
      return { success: true, filepath, filename };
    }

    // reuse existing table drawing logic (columns)
    const tableTop = doc.y;
    const col1X = 30;
    const col2X = 100;
    const col3X = 160;
    const col4X = 220;
    const col5X = 280;
    const col6X = 340;
    const col7X = 400;
    const col8X = 450;
    const col9X = 500;

    // Draw header
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1f3c88').rect(col1X, tableTop, 570, 20).fill();
    doc.fillColor('white').text('Date', col1X + 2, tableTop + 5, { width: 65 })
      .text('Organization', col2X + 2, tableTop + 5, { width: 55 })
      .text('Office', col3X + 2, tableTop + 5, { width: 55 })
      .text('Activity', col4X + 2, tableTop + 5, { width: 55 })
      .text('Venue', col5X + 2, tableTop + 5, { width: 55 })
      .text('Date', col6X + 2, tableTop + 5, { width: 55 })
      .text('In', col7X + 2, tableTop + 5, { width: 45 })
      .text('Out', col8X + 2, tableTop + 5, { width: 45 })
      .text('Pax', col9X + 2, tableTop + 5, { width: 45 });

    let currentY = tableTop + 25;
    doc.fontSize(8).font('Helvetica').fillColor('black');

    records.forEach((record, index) => {
      const rowHeight = 25;
      if (currentY + rowHeight > doc.page.height - 40) {
        doc.addPage();
        currentY = 30;
        // Redraw header
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1f3c88').rect(col1X, currentY, 570, 20).fill();
        doc.fillColor('black').fontSize(8).font('Helvetica').text('Date', col1X + 2, currentY + 5, { width: 65 })
          .text('Organization', col2X + 2, currentY + 5, { width: 55 })
          .text('Office', col3X + 2, currentY + 5, { width: 55 })
          .text('Activity', col4X + 2, currentY + 5, { width: 55 })
          .text('Venue', col5X + 2, currentY + 5, { width: 55 })
          .text('Date', col6X + 2, currentY + 5, { width: 55 })
          .text('In', col7X + 2, currentY + 5, { width: 45 })
          .text('Out', col8X + 2, currentY + 5, { width: 45 })
          .text('Pax', col9X + 2, currentY + 5, { width: 45 });
        currentY += 25;
      }

      if (index % 2 === 0) {
        doc.rect(col1X, currentY, 570, rowHeight).fill('#f9fafb');
      }

      doc.fillColor('black').fontSize(8).text(formatDate(record.date), col1X + 2, currentY + 3, { width: 65 })
        .text(record.organization_unit, col2X + 2, currentY + 3, { width: 55 })
        .text(record.office_in_charge, col3X + 2, currentY + 3, { width: 55 })
        .text(record.proposed_activity, col4X + 2, currentY + 3, { width: 55 })
        .text(record.venue, col5X + 2, currentY + 3, { width: 55 })
        .text(formatDate(record.activity_date), col6X + 2, currentY + 3, { width: 55 })
        .text(formatTime12Hour(record.time_in), col7X + 2, currentY + 3, { width: 45, align: 'center' })
        .text(formatTime12Hour(record.time_out), col8X + 2, currentY + 3, { width: 45, align: 'center' })
        .text(record.no_of_participants, col9X + 2, currentY + 3, { width: 45, align: 'center' });

      currentY += rowHeight;
    });

    doc.end();

    // Wait for stream finish
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Update reports index (no DB update needed - file-based tracking)
    const indexPath = path.join(reportsDir, 'reports_index.json');
    let index = [];
    if (fs.existsSync(indexPath)) {
      try {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) || [];
      } catch (e) {
        index = [];
      }
    }

    const archiveWeekKey = `${startDate}_to_${endDate}`;
    
    // Check if this week is already archived
    const alreadyArchived = index.some(
      (r) => r.archiveWeekKey === archiveWeekKey || (r.startDate === startDate && r.endDate === endDate)
    );

    if (!alreadyArchived) {
      index.push({ 
        period: period || 'weekly', 
        startDate, 
        endDate, 
        archiveWeekKey, 
        filename, 
        filepath, 
        generatedAt: new Date().toISOString() 
      });
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    }

    console.log('Archived report created at:', filepath);
    return { success: true, filepath, filename, archiveWeekKey };
  } catch (error) {
    console.error('Archive report error:', error);
    return { success: false, error: error.message };
  }
};

// List archived reports
exports.listArchivedReports = async (req, res) => {
  try {
    const indexPath = path.join(reportsDir, 'reports_index.json');
    let index = [];
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) || [];
    }
    res.status(200).json({ success: true, reports: index });
  } catch (error) {
    console.error('List archived reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get list of archived weeks from file index
exports.getArchivedWeeks = async (req, res) => {
  try {
    const indexPath = path.join(reportsDir, 'reports_index.json');
    let index = [];
    
    if (fs.existsSync(indexPath)) {
      try {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) || [];
      } catch (e) {
        console.warn('Could not parse reports_index.json:', e.message);
        index = [];
      }
    }

    // Transform the index into weeks data
    const weeksMap = {};
    index.forEach((report) => {
      const key = report.archiveWeekKey || report.startDate;
      if (!weeksMap[key]) {
        weeksMap[key] = {
          archive_week_key: key,
          week_start: report.startDate,
          week_end: report.endDate,
          record_count: 0,
          generated_at: report.generatedAt,
          filename: report.filename,
        };
      }
    });

    const weeks = Object.values(weeksMap).sort(
      (a, b) => new Date(b.week_start) - new Date(a.week_start)
    );

    res.status(200).json({ success: true, weeks });
  } catch (error) {
    console.error('Get archived weeks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get archived records by week key and generate PDF
exports.generateArchivedWeekReport = async (req, res) => {
  try {
    const { weekKey } = req.params;

    console.log(`Generating PDF for archived week: ${weekKey}`);

    // Parse weekKey to extract date range (format: YYYY-MM-DD_to_YYYY-MM-DD)
    const [startDate, endDate] = weekKey.split('_to_');
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Invalid week key format' });
    }

    // Fetch records for this date range
    const records = await Record.getByDateRange(startDate, endDate);

    if (!records || records.length === 0) {
      return res.status(404).json({ success: false, error: 'No records found for this week' });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 30,
      bufferPages: true,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="archived-week-report-${weekKey}-${Date.now()}.pdf"`
    );

    // Pipe to response
    doc.pipe(res);

    // ===== TITLE =====
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('ARCHIVED ACTIVITY REPORT', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Period: WEEKLY`, { align: 'center' })
      .text(`Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`, {
        align: 'center',
      })
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
      .moveDown(1);

    // ===== SUMMARY =====
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Summary Statistics', { underline: true })
      .moveDown(0.5);

    const totalRecords = records.length;
    const uniqueOrganizations = new Set(
      records.map((r) => r.organization_unit)
    ).size;
    const totalParticipants = records.reduce(
      (sum, r) => sum + parseInt(r.no_of_participants || 0),
      0
    );

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Total Activities: ${totalRecords}`)
      .text(`Total Unique Organizations: ${uniqueOrganizations}`)
      .text(`Total Participants: ${totalParticipants}`)
      .moveDown(2);

    // ===== TABLE HEADER =====
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Detailed Activity Records', { underline: true })
      .moveDown(1);

    // ===== TABLE DATA =====
    const tableTop = doc.y;
    const col1X = 30;
    const col2X = 100;
    const col3X = 160;
    const col4X = 220;
    const col5X = 280;
    const col6X = 340;
    const col7X = 400;
    const col8X = 450;
    const col9X = 500;

    // Draw header
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1f3c88')
      .rect(col1X, tableTop, 570, 20)
      .fill();

    doc
      .fillColor('white')
      .text('Date', col1X + 2, tableTop + 5, { width: 65 })
      .text('Organization', col2X + 2, tableTop + 5, { width: 55 })
      .text('Office', col3X + 2, tableTop + 5, { width: 55 })
      .text('Activity', col4X + 2, tableTop + 5, { width: 55 })
      .text('Venue', col5X + 2, tableTop + 5, { width: 55 })
      .text('Date', col6X + 2, tableTop + 5, { width: 55 })
      .text('In', col7X + 2, tableTop + 5, { width: 45 })
      .text('Out', col8X + 2, tableTop + 5, { width: 45 })
      .text('Pax', col9X + 2, tableTop + 5, { width: 45 });

    let currentY = tableTop + 25;

    doc.fontSize(8).font('Helvetica').fillColor('black');

    // Draw data rows
    records.forEach((record, index) => {
      const rowHeight = 25;

      // Check if we need a new page
      if (currentY + rowHeight > doc.page.height - 40) {
        doc.addPage();
        currentY = 30;

        // Redraw header on new page
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#1f3c88')
          .rect(col1X, currentY, 570, 20)
          .fill();

        doc
          .fillColor('black')
          .fontSize(8)
          .font('Helvetica')
          .text('Date', col1X + 2, currentY + 5, { width: 65 })
          .text('Organization', col2X + 2, currentY + 5, { width: 55 })
          .text('Office', col3X + 2, currentY + 5, { width: 55 })
          .text('Activity', col4X + 2, currentY + 5, { width: 55 })
          .text('Venue', col5X + 2, currentY + 5, { width: 55 })
          .text('Date', col6X + 2, currentY + 5, { width: 55 })
          .text('In', col7X + 2, currentY + 5, { width: 45 })
          .text('Out', col8X + 2, currentY + 5, { width: 45 })
          .text('Pax', col9X + 2, currentY + 5, { width: 45 });

        currentY += 25;
      }

      // Alternating background
      if (index % 2 === 0) {
        doc.rect(col1X, currentY, 570, rowHeight).fill('#f9fafb');
      }

      doc.fillColor('black');

      // Draw row data
      doc
        .fontSize(8)
        .text(formatDate(record.date), col1X + 2, currentY + 3, { width: 65 })
        .text(record.organization_unit, col2X + 2, currentY + 3, { width: 55 })
        .text(record.office_in_charge, col3X + 2, currentY + 3, { width: 55 })
        .text(record.proposed_activity, col4X + 2, currentY + 3, { width: 55 })
        .text(record.venue, col5X + 2, currentY + 3, { width: 55 })
        .text(formatDate(record.activity_date), col6X + 2, currentY + 3, {
          width: 55,
        })
        .text(formatTime12Hour(record.time_in), col7X + 2, currentY + 3, {
          width: 45,
          align: 'center',
        })
        .text(formatTime12Hour(record.time_out), col8X + 2, currentY + 3, {
          width: 45,
          align: 'center',
        })
        .text(record.no_of_participants, col9X + 2, currentY + 3, {
          width: 45,
          align: 'center',
        });

      currentY += rowHeight;
    });

    doc.end();

    console.log('Archived week PDF generated successfully');
  } catch (error) {
    console.error('Generate archived week report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};