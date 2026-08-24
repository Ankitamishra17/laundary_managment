import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Customer from "../models/Customer.js";
import Shop from "../models/Shop.js";
import generateToken from "../utils/generateToken.js";
import { sendResetOtpEmail } from "../utils/Email.js";

// ============================================================
// Password reset (OTP via email)
// ============================================================

const RESET_OTP_TTL_MIN = 10;
const RESET_OTP_PATTERN = /^\d{6}$/;
const RESET_MAX_ATTEMPTS = 5;
// Minimum wait between OTP emails for the same address — the public,
// unauthenticated endpoint would otherwise let anyone spam a victim's inbox.
const RESEND_COOLDOWN_MS = 60 * 1000;

// In-memory store for password-reset OTPs, keyed by normalized email.
// The code is stored hashed (bcrypt) and entries are removed on success,
// expiry, or when a fresh code is requested. (A Redis-backed store would be
// the scale-up path; consistent with the existing OTP attempt pattern.)
const resetOtps = new Map();

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

// Accounts live in two tables: users (super_admin / admin / customer) and
// employees. Returns the matched account plus which table it came from.
async function findAccountByEmail(email) {
  const user = await User.findOne({ where: { email } });
  if (user) return { account: user, type: "user" };

  const employee = await Employee.findOne({ where: { email } });
  if (employee) return { account: employee, type: "employee" };

  return null;
}

// POST /api/auth/forgot-password   { email }
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Please enter your registered email." });
    }

    const found = await findAccountByEmail(email);

    // Respond the same whether or not an account exists (and whether or not
    // it's active) so the endpoint can't be used to probe registered emails.
    const genericOk = {
      success: true,
      message: "If an account exists with that email, a reset code has been sent.",
    };

    if (!found) return res.status(200).json(genericOk);

    const { account, type } = found;
    const isActive =
      type === "user" ? account.isActive : account.status === "active";
    if (!isActive) return res.status(200).json(genericOk);

    // Don't reveal the resend-cooldown rejection either — keep the response
    // shape identical whether or not the account exists.
    const key = normalizeEmail(email);
    const existing = resetOtps.get(key);
    if (existing && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      return res.status(200).json(genericOk);
    }

    const otp = generateOtp();
    resetOtps.set(key, {
      hash: await bcrypt.hash(otp, 10),
      expires: new Date(Date.now() + RESET_OTP_TTL_MIN * 60 * 1000),
      attempts: 0,
      lastSentAt: Date.now(),
    });

    try {
      await sendResetOtpEmail(account.email, account.name, otp);
    } catch (sendErr) {
      // Don't leave a stored code the user never received
      resetOtps.delete(key);
      console.error("forgot-password email failed:", sendErr.message);
      return res.status(500).json({ success: false, message: "Could not send the reset code. Please try again." });
    }

    return res.status(200).json(genericOk);
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/verify-reset-otp   { email, otp }
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!otp || !RESET_OTP_PATTERN.test(String(otp))) {
      return res.status(400).json({ success: false, message: "Please enter the 6-digit code." });
    }

    const key = normalizeEmail(email);
    const entry = resetOtps.get(key);

    if (!entry) {
      return res.status(400).json({
        success: false,
        message: "No reset code was requested for this email. Please request a new one.",
      });
    }

    if (new Date(entry.expires) < new Date()) {
      resetOtps.delete(key);
      return res.status(400).json({ success: false, message: "This code has expired. Please request a new one." });
    }

    const match = await bcrypt.compare(String(otp), entry.hash);
    if (!match) {
      entry.attempts += 1;
      if (entry.attempts >= RESET_MAX_ATTEMPTS) {
        resetOtps.delete(key);
        return res.status(400).json({ success: false, message: "Too many incorrect attempts. Please request a new code." });
      }
      const left = RESET_MAX_ATTEMPTS - entry.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect code. ${left} attempt${left > 1 ? "s" : ""} left.`,
      });
    }

    // Success — consume the code and hand out a short-lived, purpose-scoped
    // token so the next step can't be replayed with a different email.
    resetOtps.delete(key);

    const found = await findAccountByEmail(email);
    if (!found) {
      return res.status(400).json({ success: false, message: "Account no longer exists. Please contact support." });
    }

    const token = jwt.sign(
      { id: found.account.id, type: found.type, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: `${RESET_OTP_TTL_MIN}m` }
    );

    return res.status(200).json({
      success: true,
      message: "Code verified successfully.",
      token,
    });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/reset-password   { token, newPassword }
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Reset token is missing. Please start over." });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New password and confirm password do not match." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "This reset link has expired. Please request a new code."
          : "Invalid reset link. Please request a new code.";
      return res.status(400).json({ success: false, message });
    }

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ success: false, message: "Invalid reset link. Please request a new code." });
    }

    if (decoded.type === "employee") {
      const employee = await Employee.findByPk(decoded.id);
      if (!employee) return res.status(404).json({ success: false, message: "Account not found." });

      const isSame = await employee.comparePassword(newPassword);
      if (isSame) {
        return res.status(400).json({ success: false, message: "New password must be different from your current password." });
      }

      employee.password = newPassword; // hashed automatically by the model hook
      await employee.save();
    } else {
      const user = await User.findByPk(decoded.id);
      if (!user) return res.status(404).json({ success: false, message: "Account not found." });

      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame) {
        return res.status(400).json({ success: false, message: "New password must be different from your current password." });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.mustChangePassword = false;
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Customer self sign-up (public)
// Creates the login account (users table, role "customer") plus
// the customer profile record (customers table).
// ============================================================
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, shopId, address, city } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Unique email
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Resolve the laundry this customer belongs to. If the frontend
    // supplies a shopId (e.g. deep link from a specific laundry), use it;
    // otherwise auto-assign the platform's first active laundry so the
    // customer is never orphaned with a null shopId.
    let resolvedShopId = null;
    if (shopId) {
      const shop = await Shop.findOne({
        where: { id: shopId, isActive: true, subscriptionStatus: "Active" },
      });
      if (shop) {
        resolvedShopId = Number(shopId);
      }
    }
    if (!resolvedShopId) {
      const defaultShop = await Shop.findOne({
        where: { isActive: true, subscriptionStatus: "Active" },
        order: [["createdAt", "ASC"]],
      });
      if (defaultShop) resolvedShopId = defaultShop.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "customer",
      shopId: resolvedShopId,
      mustChangePassword: false,
      isActive: true,
    });

    await Customer.create({
      userId: user.id,
      shopId: resolvedShopId,
      name,
      email,
      phone,
      address: address || null,
      city: city || null,
    });

    const token = generateToken(user, "user");

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Welcome aboard!",
      token,
      mustChangePassword: false,
      user: {
        id: user.id,
        shopId: user.shopId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "An account with this email or phone already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // 1) Try platform users (super_admin / admin / customer)
    const user = await User.findOne({
      where: { email },
    });

    if (user) {
      // Check account status
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been deactivated.",
        });
      }

      // Compare password
      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      // Generate JWT
      const token = generateToken(user, "user");

      return res.status(200).json({
        success: true,
        message: "Login successful.",
        token,

        // First login check
        mustChangePassword: user.mustChangePassword,

        user: {
          id: user.id,
          shopId: user.shopId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
        },
      });
    }

    // 2) Try employees (employees table)
    const employee = await Employee.findOne({
      where: { email },
    });

    if (employee) {
      // Check account status
      if (employee.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Your account has been deactivated.",
        });
      }

      // Compare password (hashed automatically by the Employee model hook)
      const isPasswordMatch = await employee.comparePassword(password);

      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }

      // Generate JWT scoped to the employees table
      const token = generateToken(employee, "employee");

      return res.status(200).json({
        success: true,
        message: "Login successful.",
        token,
        mustChangePassword: false,

        user: {
          id: employee.id,
          shopId: employee.shop_id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          designation: employee.designation,
          avatar: employee.avatar,
          role: "employee",
        },
      });
    }

    // 3) No account found in either table
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  } catch (error) {
    console.error("Login Error:", error);

    // Fail fast with a clear message when the DB is unreachable — the most
    // common cause of sudden "login failed" reports.
    const isDbDown =
      error.name === "SequelizeConnectionRefusedError" ||
      error.name === "SequelizeConnectionError" ||
      error.parent?.code === "ECONNREFUSED";

    if (isDbDown) {
      return res.status(503).json({
        success: false,
        message: "Database is not reachable. Please make sure MySQL is running and try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Create Password (First Login)
// Only for platform users (super_admin / admin / customer) — employees use
// the /api/profile/password endpoint instead.
export const createPassword = async (req, res) => {
  try {
    if (req.user.role === "employee") {
      return res.status(403).json({
        success: false,
        message: "Employees use the profile settings to change their password.",
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Check new password & confirm password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    // Get logged-in user
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Prevent using same password again
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the current password.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    user.password = hashedPassword;
    user.mustChangePassword = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password created successfully.",
    });
  } catch (error) {
    console.error("Create Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
