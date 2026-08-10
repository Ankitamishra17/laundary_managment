import crypto from "crypto";
import bcrypt from "bcrypt";
import { Employee } from "../models/index.js";
import { sendOtpEmail } from "../utils/Email.js";
import { sendOtpSms } from "../utils/Sms.js";

const OTP_TTL_MIN = 10;
const OTP_PATTERN = /^\d{6}$/;
const MAX_ATTEMPTS = 5;

// In-memory failed-attempt counter per employee + purpose. Cleared on success,
// on expiry, or when a fresh OTP is requested. (Simple and effective for this
// app; a Redis-based limiter would be the scale-up path.)
const otpAttempts = new Map();

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

// "john@example.com" -> "jo***@example.com"
function maskEmail(email = "") {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 2)}${"*".repeat(Math.max(3, user.length - 2))}@${domain}`;
}

// "9876543210" -> "98*****210"
function maskPhone(phone = "") {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 2)}${"*".repeat(Math.max(3, phone.length - 4))}${phone.slice(-2)}`;
}

async function storeOtp(employee, kind, otp) {
  const now = new Date();
  employee[`${kind}_otp`] = await bcrypt.hash(otp, 10);
  employee[`${kind}_otp_expires`] = new Date(now.getTime() + OTP_TTL_MIN * 60 * 1000);
  otpAttempts.delete(`${employee.id}:${kind}`);
}

async function clearOtp(employee, kind) {
  employee[`${kind}_otp`] = null;
  employee[`${kind}_otp_expires`] = null;
  otpAttempts.delete(`${employee.id}:${kind}`);
  await employee.save();
}

async function verifyOtp(employee, kind, otp) {
  const key = `${employee.id}:${kind}`;
  const hash = employee[`${kind}_otp`];
  const expires = employee[`${kind}_otp_expires`];

  if (!hash || !expires) {
    otpAttempts.delete(key);
    return { ok: false, message: "No OTP has been requested yet. Please request a new code." };
  }

  if (new Date(expires) < new Date()) {
    otpAttempts.delete(key);
    return { ok: false, message: "This OTP has expired. Please request a new code." };
  }

  const match = await bcrypt.compare(otp, hash);
  if (match) {
    otpAttempts.delete(key);
    return { ok: true };
  }

  const count = (otpAttempts.get(key) || 0) + 1;
  otpAttempts.set(key, count);

  if (count >= MAX_ATTEMPTS) {
    await clearOtp(employee, kind);
    return {
      ok: false,
      message: "Too many incorrect attempts. Please request a new OTP.",
      locked: true,
    };
  }

  return {
    ok: false,
    message: `Incorrect OTP. ${MAX_ATTEMPTS - count} attempt${MAX_ATTEMPTS - count > 1 ? "s" : ""} left.`,
  };
}

// ============================================================
// Email verification
// ============================================================

// POST /api/profile/send-email-otp
export const sendEmailOtp = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id);
    if (!employee) return res.status(404).json({ success: false, message: "Profile not found" });
    if (employee.is_verified) {
      return res.status(400).json({ success: false, message: "Your email is already verified" });
    }

    const otp = generateOtp();
    await storeOtp(employee, "email", otp);
    await employee.save();

    try {
      await sendOtpEmail(employee.email, employee.name, otp);
    } catch (sendErr) {
      // Don't leave a stored code the user never received
      await clearOtp(employee, "email");
      console.error("send-email-otp failed:", sendErr.message);
      return res.status(500).json({ success: false, message: "Could not send the OTP email. Please try again." });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${maskEmail(employee.email)}. Valid for ${OTP_TTL_MIN} minutes.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/profile/verify-email-otp   { otp }
export const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || !OTP_PATTERN.test(String(otp))) {
      return res.status(400).json({ success: false, message: "Please enter the 6-digit code" });
    }

    const employee = await Employee.findByPk(req.user.id);
    if (!employee) return res.status(404).json({ success: false, message: "Profile not found" });
    if (employee.is_verified) {
      return res.status(200).json({ success: true, message: "Email is already verified", data: { is_verified: true } });
    }

    const result = await verifyOtp(employee, "email", String(otp));
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });

    employee.is_verified = true;
    await clearOtp(employee, "email");

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: { is_verified: true },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Phone verification
// ============================================================

// POST /api/profile/send-phone-otp
export const sendPhoneOtp = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id);
    if (!employee) return res.status(404).json({ success: false, message: "Profile not found" });
    if (!employee.phone) {
      return res.status(400).json({ success: false, message: "No phone number on your profile. Ask your admin to add one." });
    }
    if (employee.is_phone_verified) {
      return res.status(400).json({ success: false, message: "Your phone number is already verified" });
    }

    const otp = generateOtp();
    await storeOtp(employee, "phone", otp);
    await employee.save();

    try {
      await sendOtpSms(employee.phone, otp);
    } catch (sendErr) {
      // Don't leave a stored code the user never received
      await clearOtp(employee, "phone");
      console.error("send-phone-otp failed:", sendErr.message);
      return res.status(500).json({ success: false, message: "Could not send the OTP by SMS. Please try again." });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${maskPhone(employee.phone)}. Valid for ${OTP_TTL_MIN} minutes.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/profile/verify-phone-otp   { otp }
export const verifyPhoneOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || !OTP_PATTERN.test(String(otp))) {
      return res.status(400).json({ success: false, message: "Please enter the 6-digit code" });
    }

    const employee = await Employee.findByPk(req.user.id);
    if (!employee) return res.status(404).json({ success: false, message: "Profile not found" });
    if (employee.is_phone_verified) {
      return res.status(200).json({ success: true, message: "Phone number is already verified", data: { is_phone_verified: true } });
    }

    const result = await verifyOtp(employee, "phone", String(otp));
    if (!result.ok) return res.status(400).json({ success: false, message: result.message });

    employee.is_phone_verified = true;
    await clearOtp(employee, "phone");

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
      data: { is_phone_verified: true },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
