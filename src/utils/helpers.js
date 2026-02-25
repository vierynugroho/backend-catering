import moment from "moment";
const TIMEZONE = "Asia/Jakarta";
/*
 * format phone number to +62
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    return "+62" + digits.slice(1);
  }

  if (digits.startsWith("62")) {
    return "+" + digits;
  }

  return digits;
};

export const getTodayWIB = () => {
  const start = moment().tz(TIMEZONE).startOf("day").toDate(); // 00:00 WIB
  const end = moment().tz(TIMEZONE).add(1, "day").startOf("day").toDate(); // H+1 00:00 WIB
  return { start, end };
};

const DATE_ONLY_FORMATS = ["DD-MM-YYYY", "YYYY-MM-DD"];

export const setToWIB = (value) => {
  if (value === null || value === undefined || value === "") return null;

  // Date object
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()))
      throw { statusCode: 400, message: "Format tanggal tidak valid" };
    return moment(value).tz(TIMEZONE).toDate();
  }

  // timestamp in ms
  if (typeof value === "number") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
      throw { statusCode: 400, message: "Format tanggal tidak valid" };
    return moment(d).tz(TIMEZONE).toDate();
  }

  if (typeof value !== "string") {
    throw { statusCode: 400, message: "Unsupported date value type" };
  }

  const str = value.trim();

  const dateOnly = moment.tz(str, DATE_ONLY_FORMATS, true, TIMEZONE);
  if (dateOnly.isValid()) {
    return dateOnly.startOf("day").toDate();
  }

  const iso = moment.parseZone(str, moment.ISO_8601, true);
  if (iso.isValid()) {
    return iso.tz(TIMEZONE).toDate();
  }

  throw {
    statusCode: 400,
    message:
      'Invalid date string. Allowed: "DD-MM-YYYY", "YYYY-MM-DD", or ISO-8601.',
  };
};

export const setWIBDateTime = (value) => {
  const d = setToWIB(value);
  if (!d) return null;

  return moment(d).tz(TIMEZONE).toDate();
};

export const setWIBDate = (value) => {
  const d = setToWIB(value);
  if (!d) return null;

  return moment(d).tz(TIMEZONE).startOf("day");
};

export const formatDateResponse = (date, show_time = false) => {
  if (!date) return null;
  return show_time
    ? moment(date).tz(TIMEZONE).format("DD-MM-YYYY HH:mm:ss")
    : moment(date).tz(TIMEZONE).format("DD-MM-YYYY");
};

export const generateOrderCode = () => {
  const datePart = moment().tz(TIMEZONE).format("DDMMYY");
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
};

export const setUTCtoWIB = (date) => {
  return moment.utc(date).tz(TIMEZONE).toDate();
};