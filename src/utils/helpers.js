import moment from "moment";
import "moment-timezone";

const WIB_TZ = "Asia/Jakarta";

/**
 * Format tanggal ke timezone WIB (Asia/Jakarta).
 * Data DB diasumsikan UTC.
 */
export const formatDateWIB = (date, show_time = true) => {
  if (!date) return "-";
  const m = moment.tz(date, WIB_TZ);
  if (!m.isValid()) return "-";
  return show_time
    ? m.format("DD-MM-YYYY HH:mm")
    : m.format("DD-MM-YYYY");
};

/*
 * format phone number to +62
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("0")) return "+62" + digits.slice(1);
  if (digits.startsWith("62")) return "+" + digits;

  return digits;
};

export const getToday = () => {
  const start = moment().startOf("day").toDate();
  const end = moment().add(1, "day").startOf("day").toDate();
  return { start, end };
};

const DATE_ONLY_FORMATS = ["DD-MM-YYYY", "YYYY-MM-DD"];
const DATETIME_FORMATS = [
  "YYYY-MM-DD HH:mm:ss",
  "YYYY-MM-DD HH:mm",
  ...DATE_ONLY_FORMATS,
];

const isDateOnlyString = (str) =>
  DATE_ONLY_FORMATS.some((f) => moment(str, f, true).isValid());

/**
 * Tanpa TZ:
 * - "YYYY-MM-DD" / "DD-MM-YYYY" => jadi Date lokal jam 00:00:00
 * - "YYYY-MM-DD HH:mm[:ss]" => jadi Date lokal sesuai jam input
 * - ISO-8601 (ada Z / offset) => tetap diparse sesuai offset (native behavior)
 */
export const setCustomDate = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()))
      throw { statusCode: 400, message: "Format tanggal tidak valid" };
    return value;
  }

  if (typeof value === "number") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
      throw { statusCode: 400, message: "Format tanggal tidak valid" };
    return d;
  }

  if (typeof value !== "string") {
    throw { statusCode: 400, message: "Unsupported date value type" };
  }

  const str = value.trim();

  // date-only => local start of day
  if (isDateOnlyString(str)) {
    const m = moment(str, DATE_ONLY_FORMATS, true).startOf("day");
    if (!m.isValid())
      throw { statusCode: 400, message: "Format tanggal tidak valid" };
    return m.toDate();
  }

  // datetime tanpa timezone => local time
  const dt = moment(str, DATETIME_FORMATS, true);
  if (dt.isValid()) return dt.toDate();

  // ISO-8601 with offset/Z
  const iso = moment.parseZone(str, moment.ISO_8601, true);
  if (iso.isValid()) return iso.toDate();

  throw {
    statusCode: 400,
    message:
      'Invalid date string. Allowed: "DD-MM-YYYY", "YYYY-MM-DD", "YYYY-MM-DD HH:mm[:ss]", or ISO-8601.',
  };
};;;;

export const setDateTime = (value) => {
  const d = setCustomDate(value);
  if (!d) return null;
  return d;
};

export const setDate = (value) => {
  const d = setCustomDate(value);
  if (!d) return null;
  return moment(value).startOf("day").toDate();
};

export const formatDateResponse = (date, show_time = false) => {
  if (!date) return null;
  return show_time
    ? moment(date).format("DD-MM-YYYY HH:mm:ss")
    : moment(date).format("DD-MM-YYYY");
};

/**
 * "NoTZ" versi bener-bener tanpa konversi timezone:
 * - show_time: "YYYY-MM-DD HH:mm:ss" (dibaca dari komponen lokal Date)
 * - date-only: "DD-MM-YYYY"
 */
export const formatDateResponseNoTZ = (date, show_time = false) => {
  if (!date) return null;

  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const pad = (n) => String(n).padStart(2, "0");

  if (show_time) {
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const MM = pad(d.getMinutes());
    const SS = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
  }

  return moment(d).format("DD-MM-YYYY");
};

export const generateOrderCode = () => {
  const datePart = moment().format("DDMMYY");
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
};