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

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (!isValidDate(d)) return String(value);
  return d.toLocaleString('en-PH');
}

function peso(v) {
  // If ₱ shows as ± in your PDF viewer, change to "PHP"
  return `₱ ${Number(v || 0).toFixed(2)}`;
  // return `PHP ${Number(v || 0).toFixed(2)}`;
}

function clamp(text, maxChars) {
  const s = String(text ?? '');
  if (s.length <= maxChars) return s;
  return `${s.slice(0, Math.max(0, maxChars - 3))}...`;
}

/**
 * Record Date-based filtering (YOU CHOSE: date)
 *
 * Assumes MySQL/MariaDB.
 * - daily:   DATE(date) = CURDATE()
 * - weekly:  YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)  (ISO week, Monday start)
 * - monthly: YEAR(date)=YEAR(CURDATE()) AND MONTH(date)=MONTH(CURDATE())
 * - custom:  DATE(date) BETWEEN ? AND ?
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
      activity_date,
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
    sql += ' AND DATE(date) BETWEEN ? AND ?';
    params.push(startDate, endDate);
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

    const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 36 });

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
      rowH: 26,
      headerH: 30,
    };

    // Base widths close to your dashboard columns
    const baseCols = [
      { key: 'record_date', label: 'Record Date', w: 95, align: 'left' },
      { key: 'organization_unit', label: 'Org Unit', w: 110, align: 'left' },
      { key: 'office_in_charge', label: 'Office in Charge', w: 135, align: 'left' },
      { key: 'proposed_activity', label: 'Proposed Activity', w: 175, align: 'left' },
      { key: 'venue', label: 'Venue', w: 105, align: 'left' },
      { key: 'environmental_fee', label: 'Environment\nal', w: 95, align: 'right' },
    ];

    const { cols, tableWidth } = fitColumnsToPage(baseCols, PAGE.width, 65);
    const TABLE_LEFT = PAGE.left + Math.max(0, Math.floor((PAGE.width - tableWidth) / 2));

    // Title & meta (like your sample)
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(26).text('All Records', PAGE.left, PAGE.top);

    doc.fillColor('#6B7280').font('Helvetica').fontSize(10);
    const metaY = PAGE.top + 34;
    doc.text(`Period: ${period}`, PAGE.left, metaY);
    doc.text(`Generated: ${new Date().toLocaleString('en-PH')}`, PAGE.left + 170, metaY);
    doc.text(`Total: ${rows.length}`, PAGE.left, metaY, { width: PAGE.width, align: 'right' });

    let y = PAGE.top + 72;

    // Header row
    doc.save();
    doc.rect(TABLE_LEFT, y, tableWidth, PAGE.headerH).fill('#1E3A8A');
    doc.restore();

    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);

    let x = TABLE_LEFT;
    cols.forEach((c) => {
      doc.text(c.label, x + 6, y + 7, { width: c.w - 12, align: 'center' });
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
      if (y + PAGE.rowH > doc.page.height - PAGE.bottom - 70) {
        doc.addPage();
        y = PAGE.top;

        // re-draw header on new page
        doc.save();
        doc.rect(TABLE_LEFT, y, tableWidth, PAGE.headerH).fill('#1E3A8A');
        doc.restore();

        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);

        let hx = TABLE_LEFT;
        cols.forEach((c) => {
          doc.text(c.label, hx + 6, y + 7, { width: c.w - 12, align: 'center' });
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
        doc.rect(TABLE_LEFT, y, tableWidth, PAGE.rowH).fill('#F8FAFC');
        doc.restore();
      }

      const r = rows[i];
      const fee = Number(r.environmental_fee || 0);
      totalFee += fee;

      const data = {
        record_date: formatDate(r.date),
        organization_unit: clamp(r.organization_unit, 18),
        office_in_charge: clamp(r.office_in_charge, 18),
        proposed_activity: clamp(r.proposed_activity, 26),
        venue: clamp(r.venue, 16),
        environmental_fee: peso(fee),
      };

      x = TABLE_LEFT;
      cols.forEach((c) => {
        const isFee = c.key === 'environmental_fee';
        doc.fillColor('#111827').font('Helvetica').fontSize(isFee ? 8.5 : 9);

        doc.text(data[c.key], x + 6, y + 8, {
          width: c.w - 12,
          align: c.align,
          lineBreak: false,
          ellipsis: true,
        });

        x += c.w;
      });

      doc.strokeColor('#D1D5DB').lineWidth(0.35);
      doc.rect(TABLE_LEFT, y, tableWidth, PAGE.rowH).stroke();

      x = TABLE_LEFT;
      cols.forEach((c) => {
        doc.moveTo(x, y).lineTo(x, y + PAGE.rowH).stroke();
        x += c.w;
      });
      doc.moveTo(x, y).lineTo(x, y + PAGE.rowH).stroke();

      y += PAGE.rowH;
    }

    // Total line
    y += 10;
    doc.strokeColor('#9CA3AF').lineWidth(0.7);
    doc.moveTo(TABLE_LEFT, y).lineTo(TABLE_LEFT + tableWidth, y).stroke();

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(14);
    doc.text(`TOTAL ENVIRONMENTAL FEE: ${peso(totalFee)}`, TABLE_LEFT, y + 10, {
      width: tableWidth,
      align: 'right',
      lineBreak: false,
      ellipsis: true,
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
      { header: 'Environmental Fee', key: 'environmental_fee', width: 20 },
      { header: 'Created At', key: 'created_at', width: 22 },
    ];

    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    header.alignment = { vertical: 'middle', horizontal: 'center' };
    header.height = 22;

    let totalFee = 0;

    rows.forEach((r, index) => {
      const fee = Number(r.environmental_fee || 0);
      totalFee += fee;

      const row = sheet.addRow({
        record_date: formatDate(r.date),
        organization_unit: r.organization_unit || '',
        office_in_charge: r.office_in_charge || '',
        proposed_activity: r.proposed_activity || '',
        venue: r.venue || '',
        environmental_fee: fee,
        created_at: formatDateTime(r.created_at),
      });

      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        });
      }
    });

    sheet.getColumn('environmental_fee').numFmt = '₱ #,##0.00';
    sheet.getColumn('environmental_fee').alignment = { horizontal: 'right' };

    sheet.addRow([]);
    const totalRow = sheet.addRow({
      proposed_activity: 'TOTAL ENVIRONMENTAL FEE',
      environmental_fee: totalFee,
    });
    totalRow.font = { bold: true };
    totalRow.getCell('environmental_fee').numFmt = '₱ #,##0.00';

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
};