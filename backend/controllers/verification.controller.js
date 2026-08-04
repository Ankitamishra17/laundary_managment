const jwt = require("jsonwebtoken");
const { Employee } = require("../models");
const { sendVerificationEmail } = require("../utils/email");

// POST /api/auth/send-verification   { email }
// Call this right after employee signup, or from a "Resend verification email" button.
exports.sendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const employee = await Employee.findOne({ where: { email } });

    if (!employee) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }
    if (employee.is_verified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    // short-lived token, purpose-scoped so it can't be reused for login
    const token = jwt.sign(
      { id: employee.id, email: employee.email, purpose: "email_verification" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    await sendVerificationEmail(employee.email, employee.name, token);

    return res.status(200).json({ success: true, message: "Verification email sent" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/verify-email?token=...
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token is missing" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Verification link has expired. Please request a new one."
          : "Invalid verification link";
      return res.status(400).json({ success: false, message });
    }

    if (decoded.purpose !== "email_verification") {
      return res.status(400).json({ success: false, message: "Invalid token type" });
    }

    const employee = await Employee.findByPk(decoded.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    if (employee.is_verified) {
      return res.status(200).json({ success: true, message: "Email already verified" });
    }

    employee.is_verified = true;
    await employee.save();

    return res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};