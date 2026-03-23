const flattenObject = (obj, prefix = "", result = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result[newKey] = "";
    } else if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "object") {
        result[newKey] = JSON.stringify(value);
      } else {
        result[newKey] = value.join(", ");
      }
    } else if (typeof value === "object") {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }
  return result;
};

export { flattenObject };
