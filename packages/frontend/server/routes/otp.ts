import { RequestHandler } from "express";
import crypto from "crypto";

/**
 * Temporary OTP stub endpoints.
 * These will be removed once the backend implements real OTP endpoints.
 * 
 * Uses an in-memory store — OTPs expire after 5 minutes.
 */

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_LENGTH = 6;

interface OtpEntry {
  code: string;
  expiresAt: number;
}

const otpStore = new Map<string, OtpEntry>();

function generateOtp(): string {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % Math.pow(10, OTP_LENGTH);
  return String(num).padStart(OTP_LENGTH, "0");
}

function cleanExpired() {
  const now = Date.now();
  for (const [key, entry] of otpStore) {
    if (entry.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}

/**
 * POST /api/otp/send
 * Body: { email: string }
 * Generates and stores an OTP for the email (logged to console in dev).
 */
export const handleSendOtp: RequestHandler = (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  cleanExpired();

  const code = generateOtp();
  otpStore.set(email.toLowerCase().trim(), {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });

  // Log OTP to console for dev testing
  console.log(`[OTP STUB] Code for ${email}: ${code}`);

  res.json({ message: "OTP sent successfully" });
};

/**
 * POST /api/otp/verify
 * Body: { email: string, token: string }
 * Verifies the OTP. Returns a mock auth response on success.
 */
export const handleVerifyOtp: RequestHandler = (req, res) => {
  const { email, token } = req.body;

  if (!email || typeof email !== "string" || !token || typeof token !== "string") {
    res.status(400).json({ message: "Email and token are required" });
    return;
  }

  cleanExpired();

  const normalizedEmail = email.toLowerCase().trim();
  const entry = otpStore.get(normalizedEmail);

  if (!entry) {
    res.status(401).json({ message: "Code expiré ou invalide. Veuillez en demander un nouveau." });
    return;
  }

  if (entry.code !== token.trim()) {
    res.status(401).json({ message: "Code incorrect. Veuillez réessayer." });
    return;
  }

  // OTP valid — delete it (single use)
  otpStore.delete(normalizedEmail);

  // Return a stub auth-like response. The frontend adapter will handle token storage.
  res.json({
    verified: true,
    email: normalizedEmail,
    message: "OTP verified successfully",
  });
};
