import Papa from "papaparse";

const escapeCell = (val) => {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

/**
 * Export rows ke CSV.
 * Header tabel diambil dinamis dari key tiap row.
 *
 * @param {Array<Object>} rows
 * @param {{
 *   brand?: string,
 *   title?: string,
 *   info?: string[],
 *   footer?: { label: string, value: string },
 * }} meta
 */
const dataToCSV = (rows, meta = {}) => {
  const { brand, title, info = [], footer } = meta;

  const lines = [];

  // ── Header block ──
  if (brand) lines.push(escapeCell(brand));
  if (title) lines.push(escapeCell(title));
  for (const line of info) lines.push(escapeCell(line));
  if (brand || title || info.length > 0) lines.push("");

  // ── Tabel ──
  if (rows && rows.length > 0) {
    const tableCsv = Papa.unparse(rows, {
      header: true,
      skipEmptyLines: true,
    });
    lines.push(tableCsv);
  }

  // ── Footer ──
  if (footer) {
    lines.push("");
    lines.push(`${escapeCell(footer.label)},${escapeCell(footer.value)}`);
  }

  return lines.join("\n");
};

export { dataToCSV };
