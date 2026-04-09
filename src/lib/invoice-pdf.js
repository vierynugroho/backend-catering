import PDFDocument from "pdfkit";

/**
 * Generate invoice PDF untuk satu order.
 *
 * @param {Object} order - Data order yang sudah di-map
 * @returns {Promise<Buffer>}
 */
const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      layout: "portrait",
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // ── Colors ──
    const primaryColor = "#3b82f6";
    const darkColor = "#1e293b";
    const grayColor = "#64748b";
    const lightGray = "#f1f5f9";
    const borderColor = "#cbd5e1";

    // ── Header: Brand ──
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("Catering Dhewi", marginLeft, 40);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(grayColor)
      .text("Jasa Catering & Katering Box", marginLeft, 65);

    // ── Header: INVOICE label (right side) ──
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("INVOICE", pageWidth - marginRight - 150, 40, {
        width: 150,
        align: "right",
      });

    // ── Separator line ──
    doc
      .moveTo(marginLeft, 90)
      .lineTo(pageWidth - marginRight, 90)
      .strokeColor(primaryColor)
      .lineWidth(2)
      .stroke();

    // ── Invoice Info ──
    let y = 105;

    // Left column: customer info
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text("Ditagih Kepada:", marginLeft, y);
    y += 14;
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(darkColor)
      .text(order.customer_name || "-", marginLeft, y);
    y += 12;
    doc.text(order.phone || "-", marginLeft, y);
    y += 12;
    doc.text(order.destination || "-", marginLeft, y, {
      width: contentWidth / 2 - 10,
    });

    // Right column: invoice details
    let yRight = 105;
    const rightCol = pageWidth - marginRight - 180;
    const labelWidth = 90;
    const valueWidth = 90;

    const addInfoRow = (label, value) => {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(grayColor)
        .text(label, rightCol, yRight, { width: labelWidth });
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(darkColor)
        .text(value, rightCol + labelWidth, yRight, {
          width: valueWidth,
          align: "right",
        });
      yRight += 14;
    };

    addInfoRow("No. Invoice:", order.code || "-");
    addInfoRow("Tanggal Order:", order.order_date_formatted || "-");
    addInfoRow("Status:", formatStatus(order.order_status));
    addInfoRow("Pengiriman:", formatStatus(order.delivery_method));

    // ── Items Table ──
    y = Math.max(y, yRight) + 25;

    // Table header
    const colNo = 30;
    const colMenu = contentWidth - colNo - 70 - 90 - 100;
    const colQty = 70;
    const colPrice = 90;
    const colSubtotal = 100;
    const headerHeight = 28;

    doc
      .rect(marginLeft, y, contentWidth, headerHeight)
      .fill(primaryColor);

    doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
    let x = marginLeft;
    doc.text("No", x + 4, y + 9, { width: colNo, align: "center" });
    x += colNo;
    doc.text("Menu", x + 4, y + 9, { width: colMenu, align: "left" });
    x += colMenu;
    doc.text("Qty", x + 4, y + 9, { width: colQty, align: "center" });
    x += colQty;
    doc.text("Harga", x + 4, y + 9, { width: colPrice, align: "right" });
    x += colPrice;
    doc.text("Subtotal", x + 4, y + 9, {
      width: colSubtotal - 8,
      align: "right",
    });

    y += headerHeight;

    // Table rows
    const items = order.items || [];
    items.forEach((item, idx) => {
      const rowHeight = 24;

      // Check page break
      if (y + rowHeight > doc.page.height - 150) {
        doc.addPage();
        y = 50;
      }

      // Alternating row color
      const bgColor = idx % 2 === 0 ? "#ffffff" : lightGray;
      doc.rect(marginLeft, y, contentWidth, rowHeight).fill(bgColor);

      // Row borders
      doc.strokeColor(borderColor).lineWidth(0.5);
      doc
        .moveTo(marginLeft, y + rowHeight)
        .lineTo(marginLeft + contentWidth, y + rowHeight)
        .stroke();

      doc.fillColor(darkColor).font("Helvetica").fontSize(8);
      x = marginLeft;
      doc.text(String(idx + 1), x + 4, y + 8, {
        width: colNo,
        align: "center",
      });
      x += colNo;
      doc.text(item.menu_name || "-", x + 4, y + 8, {
        width: colMenu - 8,
        align: "left",
      });
      x += colMenu;
      doc.text(String(item.quantity), x + 4, y + 8, {
        width: colQty,
        align: "center",
      });
      x += colQty;
      doc.text(formatRupiah(item.menu_price), x + 4, y + 8, {
        width: colPrice - 8,
        align: "right",
      });
      x += colPrice;
      doc.text(formatRupiah(item.subtotal), x + 4, y + 8, {
        width: colSubtotal - 8,
        align: "right",
      });

      y += rowHeight;
    });

    // ── Totals Section ──
    y += 15;

    if (y + 100 > doc.page.height - 60) {
      doc.addPage();
      y = 50;
    }

    const totalsX = pageWidth - marginRight - 220;
    const totalsLabelW = 120;
    const totalsValueW = 100;

    const addTotalRow = (label, value, isBold = false) => {
      doc
        .fontSize(9)
        .font(isBold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(darkColor)
        .text(label, totalsX, y, { width: totalsLabelW, align: "left" });
      doc
        .fontSize(9)
        .font(isBold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(darkColor)
        .text(value, totalsX + totalsLabelW, y, {
          width: totalsValueW,
          align: "right",
        });
      y += 16;
    };

    addTotalRow("Subtotal:", formatRupiah(order.normal_price));
    if (order.discount > 0) {
      addTotalRow("Diskon:", `- ${formatRupiah(order.discount)}`);
    }
    if (order.shipping_cost > 0) {
      addTotalRow("Ongkos Kirim:", formatRupiah(order.shipping_cost));
    }

    // Total line
    doc
      .moveTo(totalsX, y)
      .lineTo(totalsX + totalsLabelW + totalsValueW, y)
      .strokeColor(darkColor)
      .lineWidth(1)
      .stroke();
    y += 6;

    addTotalRow("Total:", formatRupiah(order.final_price), true);

    // ── Footer note ──
    y += 30;
    if (y + 40 > doc.page.height - 40) {
      doc.addPage();
      y = 50;
    }

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(grayColor)
      .text(
        "Terima kasih atas pesanan Anda. Invoice ini digenerate secara otomatis.",
        marginLeft,
        y,
        { width: contentWidth, align: "center" },
      );

    doc.end();
  });
};

const formatRupiah = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const formatStatus = (status) => {
  if (!status) return "-";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export { generateInvoicePDF };
