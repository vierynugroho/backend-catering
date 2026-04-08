import PDFDocument from "pdfkit";

/**
 * Export rows ke PDF.
 * Header tabel dinamis dari key tiap row — mapping data dilakukan di service.
 *
 * @param {Array<Object>} rows
 * @param {{
 *   brand?: string,
 *   title?: string,
 *   info?: string[],
 *   footer?: { label: string, value: string },
 * }} meta
 */
const dataToPDF = (rows, meta = {}) => {
  return new Promise((resolve, reject) => {
    const { brand, title, info = [], footer } = meta;

    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Header brand & info ──
    if (brand) {
      doc.fontSize(14).font("Helvetica-Bold").text(brand, { align: "left" });
    }
    if (title) {
      doc.fontSize(11).font("Helvetica-Bold").text(title);
    }
    for (const line of info) {
      doc.fontSize(10).font("Helvetica-Bold").text(line);
    }
    if (brand || title || info.length > 0) {
      doc.moveDown(0.7);
    }

    const headers = rows && rows.length > 0 ? Object.keys(rows[0]) : [];
    if (headers.length === 0) {
      doc.fontSize(10).font("Helvetica").text("Tidak ada data.");
      doc.end();
      return;
    }

    // ── Hitung lebar kolom proporsional terhadap konten ──
    const tableLeft = 30;
    const tableWidth = doc.page.width - 60;
    const headerRowHeight = 22;

    const measure = (text) => {
      const lines = String(text ?? "").split("\n");
      let max = 0;
      for (const line of lines) if (line.length > max) max = line.length;
      return max;
    };

    const weights = headers.map((h) => {
      let m = measure(h);
      for (const r of rows) {
        const v = measure(r[h]);
        if (v > m) m = v;
      }
      return Math.min(Math.max(m, 4), 40);
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const colWidths = weights.map((w) => (w / totalWeight) * tableWidth);

    const drawHeaderRow = (y) => {
      doc.rect(tableLeft, y, tableWidth, headerRowHeight).fill("#3b82f6");
      doc.fillColor("white").font("Helvetica-Bold").fontSize(8);
      let x = tableLeft;
      headers.forEach((h, i) => {
        doc.text(String(h), x + 4, y + 7, {
          width: colWidths[i] - 8,
          height: headerRowHeight - 4,
          align: "center",
          lineBreak: false,
        });
        x += colWidths[i];
      });
      doc.fillColor("#1e293b");
    };

    const drawDataRow = (row, y, height, isOdd) => {
      doc
        .rect(tableLeft, y, tableWidth, height)
        .fill(isOdd ? "#f1f5f9" : "#ffffff");
      doc.strokeColor("#cbd5e1").lineWidth(0.5);
      let xb = tableLeft;
      for (let i = 0; i <= colWidths.length; i++) {
        doc
          .moveTo(xb, y)
          .lineTo(xb, y + height)
          .stroke();
        xb += colWidths[i] || 0;
      }
      doc
        .moveTo(tableLeft, y)
        .lineTo(tableLeft + tableWidth, y)
        .stroke();
      doc
        .moveTo(tableLeft, y + height)
        .lineTo(tableLeft + tableWidth, y + height)
        .stroke();

      doc.fillColor("#1e293b").font("Helvetica").fontSize(7);
      let x = tableLeft;
      headers.forEach((h, i) => {
        doc.text(String(row[h] ?? ""), x + 4, y + 5, {
          width: colWidths[i] - 8,
          height: height - 6,
          align: "left",
        });
        x += colWidths[i];
      });
    };

    let y = doc.y;
    drawHeaderRow(y);
    y += headerRowHeight;

    rows.forEach((row, idx) => {
      // tinggi baris dinamis berdasar jumlah baris terbanyak antar cell
      let maxLines = 1;
      headers.forEach((h) => {
        const lines = String(row[h] ?? "").split("\n").length;
        if (lines > maxLines) maxLines = lines;
      });
      const rowHeight = Math.max(20, maxLines * 10 + 8);

      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        y = 30;
        drawHeaderRow(y);
        y += headerRowHeight;
      }

      drawDataRow(row, y, rowHeight, idx % 2 !== 0);
      y += rowHeight;
    });

    // ── Footer ──
    if (footer) {
      if (y + 30 > doc.page.height - 40) {
        doc.addPage();
        y = 30;
      } else {
        y += 10;
      }
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#1e293b")
        .text(`${footer.label} ${footer.value}`, tableLeft, y, {
          width: tableWidth,
          align: "right",
        });
    }

    doc.end();
  });
};

export { dataToPDF };
