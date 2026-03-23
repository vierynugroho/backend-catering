import PDFDocument from "pdfkit";
import { flattenObject } from "../utils/object.js";

const dataToPDF = (data) => {
  return new Promise((resolve, reject) => {
    if (!data || data.length === 0) return resolve(Buffer.alloc(0));

    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Header ──
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Orders Report", { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1);

    // ── Ambil semua kolom dari flatten ──
    const flattenedData = data.map((row) => flattenObject(row));
    const columns = Object.keys(flattenedData[0]);

    const pageWidth = doc.page.width - 60; // margin kiri + kanan
    const colWidth = Math.min(pageWidth / columns.length, 120);
    const rowHeight = 20;
    let startX = 30;
    let startY = doc.y;

    const drawRow = (rowData, y, isHeader = false) => {
      if (isHeader) {
        doc
          .rect(startX, y, colWidth * columns.length, rowHeight)
          .fill("#3b82f6");
      } else {
        doc
          .rect(startX, y, colWidth * columns.length, rowHeight)
          .fill(rowData._isOdd ? "#f1f5f9" : "#ffffff");
      }

      doc
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(7)
        .fillColor(isHeader ? "white" : "#1e293b");

      columns.forEach((col, i) => {
        const text = isHeader ? col : String(rowData[col] ?? "");
        doc.text(text, startX + i * colWidth + 4, y + 6, {
          width: colWidth - 8,
          height: rowHeight - 4,
          ellipsis: true,
          lineBreak: false,
        });
      });
    };

    // ── Draw header ──
    drawRow(null, startY, true);
    startY += rowHeight;

    // ── Draw rows ──
    flattenedData.forEach((row, idx) => {
      // Cek apakah perlu halaman baru
      if (startY + rowHeight > doc.page.height - 40) {
        doc.addPage();
        startY = 30;
        drawRow(null, startY, true); // Repeat header di halaman baru
        startY += rowHeight;
      }

      row._isOdd = idx % 2 !== 0;
      drawRow(row, startY);
      startY += rowHeight;
    });

    doc.end();
  });
};

export { dataToPDF };
