import ExcelJS from "exceljs";

/**
 * Export rows ke XLSX.
 * Header tabel diambil dinamis dari key tiap row, jadi mapping data
 * cukup dilakukan di service. Tidak ada logika domain di sini.
 *
 * @param {Array<Object>} rows  Array object — key = header, value = isi cell.
 * @param {{
 *   brand?: string,
 *   title?: string,
 *   info?: string[],            // baris-baris info di bawah title (mis. periode, tipe)
 *   sheetName?: string,
 *   footer?: { label: string, value: string },
 * }} meta
 */
const dataToXLSX = async (rows, meta = {}) => {
  const {
    brand,
    title,
    info = [],
    sheetName = "Laporan",
    footer,
  } = meta;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = brand || "App";
  workbook.created = new Date();
  const ws = workbook.addWorksheet(sheetName);

  const headers = rows && rows.length > 0 ? Object.keys(rows[0]) : [];
  const colCount = Math.max(headers.length, 1);

  let cursor = 1;

  // ── Header brand ──
  if (brand) {
    ws.mergeCells(cursor, 1, cursor, colCount);
    const c = ws.getCell(cursor, 1);
    c.value = brand;
    c.font = { bold: true, size: 16 };
    cursor++;
  }

  // ── Title ──
  if (title) {
    ws.mergeCells(cursor, 1, cursor, colCount);
    const c = ws.getCell(cursor, 1);
    c.value = title;
    c.font = { bold: true, size: 12 };
    cursor++;
  }

  // ── Info lines ──
  for (const line of info) {
    ws.mergeCells(cursor, 1, cursor, colCount);
    const c = ws.getCell(cursor, 1);
    c.value = line;
    c.font = { bold: true, size: 11 };
    cursor++;
  }

  if (cursor > 1) {
    ws.addRow([]);
  }

  if (headers.length === 0) {
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ── Tabel header ──
  const headerRow = ws.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // ── Data rows ──
  rows.forEach((row) => {
    const dataRow = ws.addRow(headers.map((h) => row[h] ?? ""));
    dataRow.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // ── Auto column width berdasar konten ──
  headers.forEach((h, i) => {
    let maxLen = String(h).length;
    rows.forEach((row) => {
      const lines = String(row[h] ?? "").split("\n");
      for (const line of lines) {
        if (line.length > maxLen) maxLen = line.length;
      }
    });
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 10), 50);
  });

  // ── Footer (mis. Total Pendapatan) ──
  if (footer) {
    ws.addRow([]);
    const totalRowIdx = ws.lastRow.number + 1;
    if (colCount > 1) {
      ws.mergeCells(totalRowIdx, 1, totalRowIdx, colCount - 1);
    }
    const labelCell = ws.getCell(totalRowIdx, 1);
    labelCell.value = footer.label;
    labelCell.font = { bold: true };
    labelCell.alignment = { horizontal: "right" };

    const valueCell = ws.getCell(totalRowIdx, colCount);
    valueCell.value = footer.value;
    valueCell.font = { bold: true };
    valueCell.alignment = { horizontal: "right" };
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

export { dataToXLSX };
