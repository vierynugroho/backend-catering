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
