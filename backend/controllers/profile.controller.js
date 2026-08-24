import bcrypt from "bcrypt";
import { Employee } from "../models/index.js";
import User from "../models/User.js";

// The profile endpoints work for every logged-in role: employees live in the
// employees table, while admins / super admins / customers live in the users
// table.
async function loadAccount(req, { withPassword = false } = {}) {
  if (req.user.role === "employee") {
    return Employee.findByPk(req.user.id, {
      attributes: withPassword ? undefined : { exclude: ["password"] },
    });
  }
  return User.findByPk(req.user.id, {
    attributes: withPassword ? undefined : { exclude: ["password"] },
  });
}

function safeAccount(account) {
  const { password: _pw, ...safe } = account.toJSON();
  return safe;
}

// GET /api/profile — the logged-in account's own profile
export const getMyProfile = async (req, res) => {
  try {
    const account = await loadAccount(req);

    if (!account) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    return res.status(200).json({ success: true, data: account });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/profile — update editable fields only
// (email/role/shop_id/status are intentionally NOT editable here — those
// stay admin-controlled via the adminEmployee.controller.js CRUD routes)
export const updateMyProfile = async (req, res) => {
  try {
    const account = await loadAccount(req, { withPassword: true });
    if (!account) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const { name, phone, designation } = req.body;
    if (name !== undefined) account.name = name;
    if (phone !== undefined) account.phone = phone;
    // Designation only exists on employee records
    if (designation !== undefined && req.user.role === "employee") {
      account.designation = designation;
    }

    await account.save();

    return res.status(200).json({ success: true, data: safeAccount(account) });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ success: false, message: "Email is already in use" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/profile/password   { currentPassword, newPassword }
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const account = await loadAccount(req, { withPassword: true });
    if (!account) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    let isMatch;
    if (req.user.role === "employee") {
      isMatch = await account.comparePassword(currentPassword);
    } else {
      isMatch = await bcrypt.compare(currentPassword, account.password);
    }
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    if (req.user.role === "employee") {
      // beforeUpdate hook re-hashes it automatically
      account.password = newPassword;
    } else {
      account.password = await bcrypt.hash(newPassword, 10);
    }
    await account.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/profile/avatar — multipart/form-data, field name: "avatar"
// Works for every role: employees save to the employees table, while
// customers (and other platform users) save to the users table.
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an avatar image",
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    if (req.user.role === "employee") {
      const employee = await Employee.findByPk(req.user.id);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      employee.avatar = avatarUrl;
      await employee.save();

      const { password: _, ...safeEmployee } = employee.toJSON();

      return res.status(200).json({
        success: true,
        message: "Avatar updated successfully",
        data: safeEmployee,
      });
    }

    // Customers & other platform users (users table)
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    user.avatar = avatarUrl;
    await user.save();

    const { password: _, ...safeUser } = user.toJSON();

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: safeUser,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};