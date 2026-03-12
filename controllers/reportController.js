const db = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

function isValidDate(d) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

function getDateFilter(period, startDate, endDate) {
  const today = new Date();
  let from = null;
  let to = null;

  if (period === 'daily') {
    from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    to = new Date(from);
    to.setDate(to.getDate() + 1);
  } else if (period === 'weekly') {
    const day = today.getDay(); // 0 Sunday
    from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day);
    to = new Date(from);
    to.setDate(to.getDate() + 7);
  } else if (period === 'monthly') {
    from = new Date(today.getFullYear(), today.getMonth(), 1);
    to = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  } else if (period === 'yearly') {
    from = new Date(today.getFullYear(), 0, 1);
    to = new Date(today.getFullYear() + 1, 0, 1);
  } else if (period === 'custom') {
    if (!startDate || !endDate) throw new Error('Custom period requires startDate and endDate');
    from = new Date(startDate);
    to = new Date(endDate);
    if (!isValidDate(from) || !isValidDate(to)) throw new Error('Invalid startDate or endDate');
    to.setDate(to.getDate() + 1); // include whole end date
  } else {
    throw new Error('Invalid period value');
  }

  return { from, to };
}

function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (!isValidDate(d)) return String(value);
  return d.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (!isValidDate(d)) return String(value);
  return d.toLocaleString();
}

function peso(v) {
  return `₱ ${Number(v || 0).toFixed(2)}`;
}

function trimText(text, maxChars = 22) {
  const t = String(text ?? '-');
  return t.length > maxChars ? `${t.slice(0, maxChars - 3)}...` : t;
}

async function fetchRecords(period, startDate, endDate) {
  const { from, to } = getDateFilter(period, startDate, endDate);

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

  if (from && to) {
    sql += ' AND created_at >= ? AND created_at < ?';
    params.push(from, to);
  }

  sql += ' ORDER BY created_at DESC';

  const [rows] = await db.execute(sql, params);
  return rows || [];
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
 */
async function downloadPDF(req, res) {
  try {
    const { period = 'daily', startDate = '', endDate = '' } = req.query;
    const rows = await fetchRecords(period, startDate, endDate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="records-report-${period}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 28 });
    doc.pipe(res);

    const PAGE = {
      left: 28,
      right: 28,
      top: 28,
      bottom: 28,
      width: doc.page.width - 56,
      rowHeight: 24,
      headerHeight: 24,
    };

    const cols = [
      { key: 'record_date', label: 'Record Date', w: 80, align: 'left' },
      { key: 'organization_unit', label: 'Organization Unit', w: 95, align: 'left' },
      { key: 'office_in_charge', label: 'Office in Charge', w: 95, align: 'left' },
      { key: 'proposed_activity', label: 'Proposed Activity', w: 110, align: 'left' },
      { key: 'venue', label: 'Venue', w: 85, align: 'left' },
      { key: 'environmental_fee', label: 'Environmental Fee', w: PAGE.width - (80 + 95 + 95 + 110 + 85), align: 'right' },
    ];

    const tableWidth = cols.reduce((s, c) => s + c.w, 0);

    const drawTitle = () => {
      doc.font('Helvetica-Bold').fillColor('#1F2937').fontSize(18).text('All Records', PAGE.left, PAGE.top);
      doc.font('Helvetica').fillColor('#6B7280').fontSize(9);
      doc.text(`Period: ${period}`, PAGE.left, PAGE.top + 24);
      doc.text(`Generated: ${new Date().toLocaleString()}`, PAGE.left + 120, PAGE.top + 24);
      doc.text(`Total: ${rows.length}`, PAGE.left + 420, PAGE.top + 24, { width: 100, align: 'right' });
    };

    const drawHeader = (y) => {
      doc.save();
      doc.rect(PAGE.left, y, tableWidth, PAGE.headerHeight).fill('#1E3A8A');
      doc.restore();

      let x = PAGE.left;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');

      cols.forEach((c) => {
        doc.text(c.label, x + 6, y + 7, {
          width: c.w - 12,
          align: c.align === 'right' ? 'right' : 'left',
          ellipsis: true,
        });
        x += c.w;
      });

      // header borders
      x = PAGE.left;
      doc.strokeColor('#FFFFFF').lineWidth(0.4);
      cols.forEach((c) => {
        doc.moveTo(x, y).lineTo(x, y + PAGE.headerHeight).stroke();
        x += c.w;
      });
      doc.moveTo(x, y).lineTo(x, y + PAGE.headerHeight).stroke();

      return y + PAGE.headerHeight;
    };

    const drawRow = (y, row, index) => {
      if (index % 2 === 0) {
        doc.save();
        doc.rect(PAGE.left, y, tableWidth, PAGE.rowHeight).fill('#F8FAFC');
        doc.restore();
      }

      const fee = Number(row.environmental_fee || 0);

      const data = {
        record_date: formatDate(row.date),
        organization_unit: trimText(row.organization_unit, 18),
        office_in_charge: trimText(row.office_in_charge, 18),
        proposed_activity: trimText(row.proposed_activity, 22),
        venue: trimText(row.venue, 16),
        environmental_fee: peso(fee),
      };

      let x = PAGE.left;
      doc.font('Helvetica').fontSize(9).fillColor('#111827');

      cols.forEach((c) => {
        doc.text(data[c.key], x + 6, y + 7, {
          width: c.w - 12,
          align: c.align,
          ellipsis: true,
        });
        x += c.w;
      });

      // row border
      doc.strokeColor('#D1D5DB').lineWidth(0.35);
      doc.rect(PAGE.left, y, tableWidth, PAGE.rowHeight).stroke();

      // vertical lines
      x = PAGE.left;
      cols.forEach((c) => {
        doc.moveTo(x, y).lineTo(x, y + PAGE.rowHeight).stroke();
        x += c.w;
      });
      doc.moveTo(x, y).lineTo(x, y + PAGE.rowHeight).stroke();

      return y + PAGE.rowHeight;
    };

    drawTitle();

    let y = PAGE.top + 46;
    y = drawHeader(y);

    let totalFee = 0;

    for (let i = 0; i < rows.length; i++) {
      if (y + PAGE.rowHeight > doc.page.height - PAGE.bottom - 40) {
        doc.addPage();
        drawTitle();
        y = drawHeader(PAGE.top + 46);
      }

      totalFee += Number(rows[i].environmental_fee || 0);
      y = drawRow(y, rows[i], i);
    }

    if (y + 30 > doc.page.height - PAGE.bottom) {
      doc.addPage();
      y = PAGE.top;
    }

    doc.moveTo(PAGE.left, y + 8).lineTo(PAGE.left + tableWidth, y + 8).strokeColor('#9CA3AF').stroke();
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827');
    doc.text(`TOTAL ENVIRONMENTAL FEE: ${peso(totalFee)}`, PAGE.left, y + 14, {
      width: tableWidth - 6,
      align: 'right',
    });

    doc.end();
  } catch (error) {
    console.error('downloadPDF error:', error);
    return res.status(400).json({ error: error.message || 'Failed to generate PDF' });
  }
}

/**
 * GET /api/reports/excel
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
      { header: 'Activity Date', key: 'activity_date', width: 14 },
      { header: 'Time In', key: 'time_in', width: 12 },
      { header: 'Time Out', key: 'time_out', width: 12 },
      { header: 'Participants', key: 'no_of_participants', width: 14 },
      { header: 'Created At', key: 'created_at', width: 22 },
    ];

    // Header style
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
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
        activity_date: formatDate(r.activity_date),
        time_in: r.time_in || '',
        time_out: r.time_out || '',
        no_of_participants: Number(r.no_of_participants || 0),
        created_at: formatDateTime(r.created_at),
      });

      // zebra rows
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        });
      }
    });

    // Currency format
    sheet.getColumn('environmental_fee').numFmt = '₱ #,##0.00';

    // Borders + alignment
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        };
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
    });
    sheet.getColumn('environmental_fee').alignment = { horizontal: 'right' };

    // Total row
    sheet.addRow([]);
    const totalRow = sheet.addRow({
      proposed_activity: 'TOTAL ENVIRONMENTAL FEE',
      environmental_fee: totalFee,
    });
    totalRow.font = { bold: true };
    totalRow.getCell('environmental_fee').numFmt = '₱ #,##0.00';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
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