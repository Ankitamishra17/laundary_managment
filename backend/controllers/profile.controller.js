import { Employee } from "../models/index.js";

// GET /api/profile — the logged-in employee's own profile
export const getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    return res.status(200).json({ success: true, data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/profile — update editable fields only
// (email/role/shop_id/status are intentionally NOT editable here — those
// stay admin-controlled via the adminEmployee.controller.js CRUD routes)
export const updateMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const { name, phone, designation } = req.body;
    if (name !== undefined) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (designation !== undefined) employee.designation = designation;

    await employee.save();

    const { password: _, ...safeEmployee } = employee.toJSON();
    return res.status(200).json({ success: true, data: safeEmployee });
  } catch (error) {
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

    const employee = await Employee.findByPk(req.user.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const isMatch = await employee.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    employee.password = newPassword; // beforeUpdate hook re-hashes it automatically
    await employee.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/profile/avatar — multipart/form-data, field name: "avatar"
// NOTE: multer is not installed yet, so this only returns a friendly error
// until the upload middleware is wired up.
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an avatar image",
      });
    }

    const employee = await Employee.findByPk(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    employee.avatar = avatarUrl;

    await employee.save();

    const { password: _, ...safeEmployee } = employee.toJSON();

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: safeEmployee,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};