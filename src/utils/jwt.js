import jwt from "jsonwebtoken";
const { sign, verify } = jwt;

/**
 *  Fungsi untuk generate JWT token
 * @param {*} payload
 * @returns jwt token
 */
const generateToken = (payload) => {
  return sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Fungsi untuk memvalidasi JWT Token
 * @param {*} token
 * @returns  boolean | valid or invalid token
 */
const verifyToken = (token) => {
  return verify(token, process.env.JWT_SECRET);
};

export { generateToken, verifyToken };
