import { dataToCSV } from "../lib/csv.js";
import { dataToPDF } from "../lib/pdf.js";

/**
 *
 * @param {*} data
 * @returns
 */
const exportToCSV = async (data) => {
  const csvData = dataToCSV(data);
  return csvData;
};

const exportToPDF = async (data) => {
  const pdfDoc = dataToPDF(data);
  return pdfDoc;
};

export default {
  exportToCSV,
  exportToPDF,
};
