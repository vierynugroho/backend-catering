import { dataToCSV } from "../lib/csv.js";
import { dataToPDF } from "../lib/pdf.js";
import { dataToXLSX } from "../lib/xlsx.js";

const exportToCSV = async (rows, meta) => dataToCSV(rows, meta);
const exportToXLSX = async (rows, meta) => dataToXLSX(rows, meta);
const exportToPDF = async (rows, meta) => dataToPDF(rows, meta);

export default {
  exportToCSV,
  exportToXLSX,
  exportToPDF,
};
