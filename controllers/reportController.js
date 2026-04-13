const db = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

function isValidDate(d) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (!isValidDate(d)) return String(value);
  return d.toLocaleDateString('en-PH');
}

/**
 * Format date range with proper null handling
 * Ensures both dates are displayed, defaulting to '-' if missing
 */
function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate) || '-';
  const end = formatDate(endDate) || '-';
  return `${start} to ${end}`;
}

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (!isValidDate(d)) return String(value);
  return d.toLocaleString('en-PH');
}

function peso(v) {
  // If ₱ shows as ± in your PDF viewer, change to "PHP"
  return `PHP ${Number(v || 0).toFixed(2)}`;
}

/**
 * Calculate actual text height needed for wrapped text at given width
 * Uses a rough estimate based on character count and column width
 */
function estimateWrappedTextHeight(text, columnWidth, fontSize = 6.5) {
  const textStr = String(text || '');
  if (!textStr) return fontSize * 1.15; // Minimum height for one empty line
  
  // Rough estimate: at 6.5pt font, approximately 12-15 characters fit per line per 50 points
  // Adjust for actual column width
  const avgCharsPerLine = Math.max(5, Math.round((columnWidth / 50) * 12));
  const numLines = Math.max(1, Math.ceil(textStr.length / avgCharsPerLine));
  
  // Line height multiplier (typically 1.15x the font size for wrapped text)
  return numLines * (fontSize * 1.15);
}

/**
 * Record Date-based filtering (YOU CHOSE: date)
 *
 * Assumes MySQL/MariaDB.
 * - daily:   DATE(date) = CURDATE()
 * - weekly:  YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)  (ISO week, Monday start)
 * - monthly: YEAR(date)=YEAR(CURDATE()) AND MONTH(date)=MONTH(CURDATE())
 * - custom:  Activity dates overlap with selected date range (matches frontend filter)
 */
async function fetchRecords(period, startDate, endDate) {
  let sql = `
    SELECT
      id,
      date,
      organization_unit,
      office_in_charge,
      proposed_activity,
      venue,
      activity_date_from,
      activity_date_to,
      time_in,
      time_out,
      no_of_participants,
      environmental_fee,
      created_at
    FROM records
    WHERE 1=1
  `;
  const params = [];

  if (period === 'daily') {
    sql += ' AND DATE(date) = CURDATE()';
  } else if (period === 'weekly') {
    sql += ' AND YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)';
  } else if (period === 'monthly') {
    sql += ' AND YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())';
  } else if (period === 'yearly') {
    sql += ' AND YEAR(date) = YEAR(CURDATE())';
  } else if (period === 'custom') {
    if (!startDate || !endDate) throw new Error('Custom period requires startDate and endDate');
    // Filter by activity dates: activity overlaps with the selected date range
    // Matches frontend logic: activityStart <= filterEnd AND activityEnd >= filterStart
    sql += ' AND DATE(activity_date_from) <= ? AND DATE(activity_date_to) >= ?';
    params.push(endDate, startDate);
  } else {
    throw new Error('Invalid period value');
  }

  sql += ' ORDER BY date DESC, created_at DESC';

  const [rows] = await db.execute(sql, params);
  return rows || [];
}

/**
 * Helper: ensure table fits page width and is centered.
 */
function fitColumnsToPage(cols, pageWidth, minW = 60) {
  const total = cols.reduce((s, c) => s + c.w, 0);
  if (total <= pageWidth) return { cols, tableWidth: total };

  const scale = pageWidth / total;

  const scaled = cols.map((c) => ({
    ...c,
    w: Math.max(minW, Math.floor(c.w * scale)),
  }));

  // fix rounding drift
  let sum = scaled.reduce((s, c) => s + c.w, 0);
  let diff = pageWidth - sum;

  const order = ['proposed_activity', 'office_in_charge', 'organization_unit', 'venue', 'environmental_fee', 'record_date'];
  let guard = 0;

  while (diff !== 0 && guard < 4000) {
    const key = order[guard % order.length];
    const col = scaled.find((c) => c.key === key);
    if (col && col.w > minW) {
      col.w += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1;
    }
    guard++;
  }

  return { cols: scaled, tableWidth: scaled.reduce((s, c) => s + c.w, 0) };
}

/**
 * GET /api/reports/summary
 */
async function getSummary(req, res) {
  try {
    const { period = 'daily', startDate = '', endDate = '' } = req.query;
    const rows = await fetchRecords(period, startDate, endDate);

    const totalEnvironmentalFee = rows.reduce((sum, r) => sum + Number(r.environmental_fee || 0), 0);
    const totalParticipants = rows.reduce((sum, r) => sum + Number(r.no_of_participants || 0), 0);

    return res.json({
      success: true,
      summary: {
        totalEnvironmentalFee,
        totalParticipants,
      },
      count: rows.length,
    });
  } catch (error) {
    console.error('getSummary error:', error);
    return res.status(400).json({ error: error.message || 'Failed to generate summary' });
  }
}

/**
 * GET /api/reports/pdf
 * A4 portrait, centered table, uses Record Date (date) filtering
 */
async function downloadPDF(req, res) {
  try {
    const { period = 'daily', startDate = '', endDate = '' } = req.query;

    if (period === 'custom' && (!startDate || !endDate)) {
      return res.status(400).json({ error: 'Custom period requires startDate and endDate' });
    }

    const rows = await fetchRecords(period, startDate, endDate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="records-report-${period}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 20 });

    doc.on('error', (e) => {
      console.error('[PDF] doc error:', e);
      try { res.end(); } catch (_) {}
    });

    doc.pipe(res);

    const PAGE = {
      left: doc.page.margins.left,
      right: doc.page.margins.right,
      top: doc.page.margins.top,
      bottom: doc.page.margins.bottom,
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      minRowH: 20,  // Minimum row height for wrapped text
      headerH: 28,   // Increased header height for better readability
    };

    // Optimized column widths for A4 portrait with text wrapping
    // Total must fit within PAGE.width, allowing room for wrapped text
    const baseCols = [
      { key: 'record_date', label: 'Rec. Date', w: 45, align: 'center' },
      { key: 'organization_unit', label: 'Organization/Unit', w: 70, align: 'left' },
      { key: 'office_in_charge', label: 'Officer in Charge', w: 70, align: 'left' },
      { key: 'proposed_activity', label: 'Proposed Activity', w: 80, align: 'left' },
      { key: 'venue', label: 'Venue', w: 65, align: 'left' },
      { key: 'activity_date', label: 'Activity Date', w: 85, align: 'center' },
      { key: 'time_in', label: 'Time In', w: 40, align: 'center' },
      { key: 'time_out', label: 'Time Out', w: 40, align: 'center' },
      { key: 'environmental_fee', label: 'Environmental Fee', w: 65, align: 'right' },
    ];

    const { cols, tableWidth } = fitColumnsToPage(baseCols, PAGE.width, 45);
    const TABLE_LEFT = PAGE.left + Math.max(0, Math.floor((PAGE.width - tableWidth) / 2));

    // Title & meta (like your sample)
    doc.fillColor('#1b5e3f').font('Helvetica-Bold').fontSize(26).text('All Records', PAGE.left, PAGE.top);

    doc.fillColor('#6B7280').font('Helvetica').fontSize(10);
    const metaY = PAGE.top + 34;
    doc.text(`Period: ${period}`, PAGE.left, metaY);
    doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, PAGE.left + 170, metaY);
    doc.text(`Total: ${rows.length}`, PAGE.left, metaY, { width: PAGE.width, align: 'right' });

    let y = PAGE.top + 72;

    // Header row
    doc.save();
    doc.rect(TABLE_LEFT, y, tableWidth, PAGE.headerH).fill('#1b5e3f');
    doc.restore();

    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);

    let x = TABLE_LEFT;
    cols.forEach((c) => {
      doc.text(c.label, x + 2, y + 5, { width: c.w - 4, align: c.align, lineBreak: true, height: PAGE.headerH - 10 });
      x += c.w;
    });

    doc.strokeColor('#FFFFFF').lineWidth(0.4);
    x = TABLE_LEFT;
    cols.forEach((c) => {
      doc.moveTo(x, y).lineTo(x, y + PAGE.headerH).stroke();
      x += c.w;
    });
    doc.moveTo(x, y).lineTo(x, y + PAGE.headerH).stroke();

    y += PAGE.headerH;

    // Body
    let totalFee = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const fee = Number(r.environmental_fee || 0);
      totalFee += fee;

      const formatTime = (time) => {
        if (!time) return '-';
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        if (hour > 12) hour = hour - 12;
        else if (hour === 0) hour = 12;
        return `${String(hour).padStart(2, '0')}:${minutes} ${ampm}`;
      };

      // Full text - no truncation for PDF
      // Ensure both activity dates are properly retrieved and formatted
      const activityDateFrom = r.activity_date_from;
      const activityDateTo = r.activity_date_to;
      
      // Validate that dates are not just empty strings
      const hasStartDate = activityDateFrom && activityDateFrom.toString().trim() !== '';
      const hasEndDate = activityDateTo && activityDateTo.toString().trim() !== '';
      
      const data = {
        record_date: formatDate(r.date),
        organization_unit: r.organization_unit || '',
        office_in_charge: r.office_in_charge || '',
        proposed_activity: r.proposed_activity || '',
        venue: r.venue || '',
        activity_date: formatDateRange(
          hasStartDate ? activityDateFrom : null,
          hasEndDate ? activityDateTo : null
        ),
        time_in: formatTime(r.time_in),
        time_out: formatTime(r.time_out),
        environmental_fee: peso(fee),
      };

      // Calculate required row height based on wrapped text
      let maxHeight = PAGE.minRowH;
      cols.forEach((c) => {
        const cellText = String(data[c.key] || '');
        const cellHeight = estimateWrappedTextHeight(cellText, c.w);
        maxHeight = Math.max(maxHeight, cellHeight + 8); // +8 for padding
      });
      
      // Dynamic row height: accounts for wrapped text
      const rowH = maxHeight;

      // Page break handling with dynamic row height
      if (y + rowH > doc.page.height - PAGE.bottom - 70) {
        doc.addPage();
        y = PAGE.top;

        // re-draw header on new page
        doc.save();
        doc.rect(TABLE_LEFT, y, tableWidth, PAGE.headerH).fill('#1b5e3f');
        doc.restore();

        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);

        let hx = TABLE_LEFT;
        cols.forEach((c) => {
          doc.text(c.label, hx + 2, y + 5, { width: c.w - 4, align: c.align, lineBreak: true });
          hx += c.w;
        });

        doc.strokeColor('#FFFFFF').lineWidth(0.4);
        hx = TABLE_LEFT;
        cols.forEach((c) => {
          doc.moveTo(hx, y).lineTo(hx, y + PAGE.headerH).stroke();
          hx += c.w;
        });
        doc.moveTo(hx, y).lineTo(hx, y + PAGE.headerH).stroke();

        y += PAGE.headerH;
      }

      if (i % 2 === 0) {
        doc.save();
        doc.rect(TABLE_LEFT, y, tableWidth, rowH).fill('#F8FAFC');
        doc.restore();
      }

      x = TABLE_LEFT;
      cols.forEach((c) => {
        doc.fillColor('#111827').font('Helvetica').fontSize(6.5);

        doc.text(data[c.key], x + 2, y + 4, {
          width: c.w - 4,
          align: c.align,
          height: rowH - 8,
          lineBreak: true,
          ellipsis: false,
        });

        x += c.w;
      });

      doc.strokeColor('#D1D5DB').lineWidth(0.35);
      doc.rect(TABLE_LEFT, y, tableWidth, rowH).stroke();

      x = TABLE_LEFT;
      cols.forEach((c) => {
        doc.moveTo(x, y).lineTo(x, y + rowH).stroke();
        x += c.w;
      });
      doc.moveTo(x, y).lineTo(x, y + rowH).stroke();

      y += rowH;
    }

    // Total line
    y += 10;
    doc.strokeColor('#9CA3AF').lineWidth(0.7);
    doc.moveTo(TABLE_LEFT, y).lineTo(TABLE_LEFT + tableWidth, y).stroke();

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(14);
    doc.text(`TOTAL ENVIRONMENTAL FEE: ${peso(totalFee)}`, TABLE_LEFT, y + 10, {
      width: tableWidth,
      align: 'left',
      lineBreak: true,
      ellipsis: false,
    });

    doc.end();
  } catch (error) {
    console.error('downloadPDF error:', error);
    if (!res.headersSent) return res.status(500).json({ error: error.message || 'Failed to generate PDF' });
    try { res.end(); } catch (_) {}
  }
}

/**
 * GET /api/reports/excel
 * Keep as-is or adjust later (still uses fetchRecords which now filters by date).
 */
async function downloadExcel(req, res) {
  try {
    const { period = 'daily', startDate = '', endDate = '' } = req.query;
    const rows = await fetchRecords(period, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('All Records');

    sheet.columns = [
      { header: 'Record Date', key: 'record_date', width: 14 },
      { header: 'Organization Unit', key: 'organization_unit', width: 24 },
      { header: 'Office in Charge', key: 'office_in_charge', width: 24 },
      { header: 'Proposed Activity', key: 'proposed_activity', width: 35 },
      { header: 'Venue', key: 'venue', width: 20 },
      { header: 'Activity Date Range', key: 'activity_date', width: 28 },
      { header: 'Environmental Fee', key: 'environmental_fee', width: 20 },
      { header: 'Created At', key: 'created_at', width: 22 },
    ];

    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1b5e3f' } };
    header.alignment = { vertical: 'middle', horizontal: 'center' };
    header.height = 22;

    // Apply borders to header row
    header.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });

    let totalFee = 0;

    rows.forEach((r, index) => {
      const fee = Number(r.environmental_fee || 0);
      totalFee += fee;

      // Ensure both activity dates are present and properly formatted
      const activityDateFrom = r.activity_date_from;
      const activityDateTo = r.activity_date_to;
      const hasStartDate = activityDateFrom && activityDateFrom.toString().trim() !== '';
      const hasEndDate = activityDateTo && activityDateTo.toString().trim() !== '';

      const row = sheet.addRow({
        record_date: formatDate(r.date),
        organization_unit: r.organization_unit || '',
        office_in_charge: r.office_in_charge || '',
        proposed_activity: r.proposed_activity || '',
        venue: r.venue || '',
        activity_date: formatDateRange(
          hasStartDate ? activityDateFrom : null,
          hasEndDate ? activityDateTo : null
        ),
        environmental_fee: fee,
        created_at: formatDateTime(r.created_at),
      });

      // Apply alternating row colors and borders
      row.eachCell((cell) => {
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
        // Apply borders to all data cells
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    });

    sheet.getColumn('environmental_fee').numFmt = '₱ #,##0.00';
    sheet.getColumn('environmental_fee').alignment = { horizontal: 'right' };

    const emptyRow = sheet.addRow([]);
    // Add borders to empty row
    emptyRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });

    const totalRow = sheet.addRow({
      record_date: 'TOTAL ENVIRONMENTAL FEE',
      environmental_fee: totalFee,
    });
    totalRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1b5e3f' } };
    totalRow.getCell('environmental_fee').numFmt = '₱ #,##0.00';
    
    // Apply borders to total row
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="records-report-${period}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('downloadExcel error:', error);
    return res.status(400).json({ error: error.message || 'Failed to generate Excel' });
  }
}

module.exports = {
  getSummary,
  downloadPDF,
  downloadExcel,
  archiveReport: async (period, options) => {
    // Placeholder for archive functionality
    return { success: true, message: 'Archive not yet implemented' };
  },
};