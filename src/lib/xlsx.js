const XLSX = require("xlsx");

const dataToXLSX = (data) => {
  if (!data || data.length === 0) {
    return null;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return xlsxBuffer;
};

export default {
  dataToXLSX,
};
