import Papa from "papaparse";
import { flattenObject } from "../utils/object.js";

const dataToCSV = (data, options = {}) => {
  if (!data || data.length === 0) return "";

  const flattenedData = data.map((row) => flattenObject(row));

  return Papa.unparse(flattenedData, {
    header: true,
    skipEmptyLines: true,
    ...options,
  });
};

export { dataToCSV };
