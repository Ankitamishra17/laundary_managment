import { Op } from "sequelize";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import sequelize from "../config/database.js";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Customer from "../models/Customer.js";
import Employee from "../models/Employee.js";

// ============================================================
// CONFIG
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 10);

// ============================================================
// HELPERS
// ============================================================

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

const normalizePhone = (phone) => {
  return String(phone || "")
    .trim()
    .replace(/\s+/g, "");
};

const normalizeSlug = (slug) => {
  return String(slug || "")
    .trim()
    .toLowerCase();
};

const normalizeRole = (role) => {
  return String(role || "")
    .trim()
    .toLowerCase();
};

const safeUser = (user) => {
  if (!user) return null;

  const data = user.toJSON ? user.toJSON() : { ...user };

  delete data.password;
  delete data.resetOtp;
  delete data.resetOtpExpires;

  return data;
};

// ============================================================
// JWT
// ============================================================

const generateToken = (user, extra = {}) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      shopId: user.shopId ?? user.shop_id ?? null,
      ...extra,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
};

// ============================================================
// ERROR LOGGER
// ============================================================

const logAuthError = (label, error) => {
  console.error(`\n========== ${label} ERROR ==========`);

  console.error("Message:", error?.message);
  console.error("Name:", error?.name);
  console.error("Code:", error?.code);
  console.error("SQL Message:", error?.parent?.sqlMessage);
  console.error("SQL:", error?.sql);

  console.error("====================================\n");
};

// ============================================================
// 1. GLOBAL LOGIN
//
// POST /api/auth/login
//
// Used by:
// - super_admin
// - admin
//
// NOT used by:
// - customer
// - employee
// ============================================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ----------------------------------------------------------
    // FIND ADMIN / SUPER ADMIN
    // ----------------------------------------------------------

    const user = await User.findOne({
      where: {
        email: normalizedEmail,
        role: {
          [Op.in]: ["super_admin", "admin"],
        },
      },
      include: [
        {
          model: Shop,
          as: "shop",
          required: false,
        },
      ],
    });

    // ----------------------------------------------------------
    // USER NOT FOUND
    // ----------------------------------------------------------

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ----------------------------------------------------------
    // DELETED CHECK
    // ----------------------------------------------------------

    if (user.isDeleted === true) {
      return res.status(403).json({
        success: false,
        message: "This account has been deleted",
      });
    }

    // ----------------------------------------------------------
    // ACTIVE CHECK
    // ----------------------------------------------------------

    if (
      user.isActive === false ||
      user.status === "inactive" ||
      user.status === "blocked"
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // ----------------------------------------------------------
    // PASSWORD CHECK
    // ----------------------------------------------------------

    let passwordMatch = false;

    if (typeof user.comparePassword === "function") {
      passwordMatch = await user.comparePassword(password);
    } else {
      passwordMatch = await bcrypt.compare(password, user.password);
    }

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ----------------------------------------------------------
    // CREATE TOKEN
    // ----------------------------------------------------------

    const token = generateToken(user, {
      type: "user",
    });

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: safeUser(user),

      shop: user.shop
        ? {
            id: user.shop.id,
            shopCode: user.shop.shopCode,
            slug: user.shop.slug,
            name: user.shop.name,
            logo: user.shop.logo,
          }
        : null,

      mustChangePassword: Boolean(user.mustChangePassword),
    });
  } catch (error) {
    logAuthError("GLOBAL LOGIN", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// 2. SHOP LOGIN
//
// POST /api/auth/shop/:slug/login
//
// Used by:
// - customer
// - employee
//
// Example:
// POST /api/auth/shop/fresh/login
//
// Customer:
// User table
//
// Employee:
// Employee table
//
// Tenant isolation:
// email + shopId / shop_id
// ============================================================

export const shopLogin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, password } = req.body;

    const normalizedSlug = normalizeSlug(slug);
    const normalizedEmail = normalizeEmail(email);

    // ============================================================
    // 1. VALIDATION
    // ============================================================

    if (!normalizedSlug) {
      return res.status(400).json({
        success: false,
        message: "Shop slug is required",
      });
    }

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ============================================================
    // 2. FIND SHOP
    // ============================================================

    const shop = await Shop.findOne({
      where: {
        slug: normalizedSlug,
      },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Laundry shop not found",
      });
    }

    // ============================================================
    // 3. CHECK SHOP STATUS
    // ============================================================

    if (shop.isDeleted === true) {
      return res.status(403).json({
        success: false,
        message: "This laundry shop is no longer available",
      });
    }

    if (shop.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This laundry shop is inactive",
      });
    }

    // ============================================================
    // 4. CUSTOMER LOGIN
    // ============================================================
    //
    // Customer is stored in User table.
    //
    // Search:
    // email + shopId + role customer
    //
    // IMPORTANT:
    // Do NOT search employee here.
    // ============================================================

    const customer = await User.findOne({
      where: {
        email: normalizedEmail,
        shopId: shop.id,
        role: "customer",
      },
    });

    // ============================================================
    // 5. CUSTOMER FOUND
    // ============================================================

    if (customer) {
      // ----------------------------------------------------------
      // DELETED CHECK
      // ----------------------------------------------------------

      if (customer.isDeleted === true) {
        return res.status(403).json({
          success: false,
          message: "This account has been deleted",
        });
      }

      // ----------------------------------------------------------
      // ACTIVE CHECK
      // ----------------------------------------------------------

      if (
        customer.isActive === false ||
        customer.status === "inactive" ||
        customer.status === "blocked"
      ) {
        return res.status(403).json({
          success: false,
          message: "Your account is inactive",
        });
      }

      // ----------------------------------------------------------
      // PASSWORD CHECK
      // ----------------------------------------------------------

      let passwordMatch = false;

      if (typeof customer.comparePassword === "function") {
        passwordMatch = await customer.comparePassword(password);
      } else {
        passwordMatch = await bcrypt.compare(password, customer.password);
      }

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // ----------------------------------------------------------
      // CUSTOMER TOKEN
      // ----------------------------------------------------------

      const token = generateToken(customer, {
        type: "user",
        slug: shop.slug,
      });

      // ----------------------------------------------------------
      // CUSTOMER RESPONSE
      // ----------------------------------------------------------

      return res.status(200).json({
        success: true,
        message: "Customer login successful",

        token,

        user: {
          ...safeUser(customer),
          id: customer.id,
          role: "customer",
          shopId: customer.shopId,
        },

        shop: {
          id: shop.id,
          shopCode: shop.shopCode,
          slug: shop.slug,
          name: shop.name,
          ownerName: shop.ownerName,
          email: shop.email,
          phone: shop.phone,
          address: shop.address,
          city: shop.city,
          state: shop.state,
          country: shop.country,
          logo: shop.logo,
          favicon: shop.favicon,
          primaryColor: shop.primaryColor,
          secondaryColor: shop.secondaryColor,
        },

        mustChangePassword: Boolean(customer.mustChangePassword),
      });
    }

    // ============================================================
    // 6. EMPLOYEE LOGIN
    // ============================================================
    //
    // Employee is stored in Employee table.
    //
    // Search:
    // email + shop_id
    //
    // This guarantees tenant isolation.
    // ============================================================

    const employee = await Employee.findOne({
      where: {
        email: normalizedEmail,
        shop_id: shop.id,
      },
    });

    // ============================================================
    // 7. EMPLOYEE NOT FOUND
    // ============================================================

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ============================================================
    // 8. EMPLOYEE STATUS
    // ============================================================

    if (employee.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Employee account is inactive",
      });
    }

    // ============================================================
    // 9. EMPLOYEE PASSWORD
    // ============================================================

    let employeePasswordMatch = false;

    if (typeof employee.comparePassword === "function") {
      employeePasswordMatch = await employee.comparePassword(password);
    } else {
      employeePasswordMatch = await bcrypt.compare(password, employee.password);
    }

    if (!employeePasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ============================================================
    // 10. EMPLOYEE TOKEN
    // ============================================================
    //
    // VERY IMPORTANT:
    //
    // type: "employee"
    //
    // Your authMiddleware uses this to identify Employee.
    // ============================================================

    const employeeToken = jwt.sign(
      {
        id: employee.id,
        type: "employee",
        role: "employee",
        shopId: employee.shop_id,
        slug: shop.slug,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      },
    );

    // ============================================================
    // 11. REMOVE PASSWORD
    // ============================================================

    const employeeData = employee.toJSON ? employee.toJSON() : { ...employee };

    delete employeeData.password;

    // ============================================================
    // 12. EMPLOYEE RESPONSE
    // ============================================================

    return res.status(200).json({
      success: true,
      message: "Employee login successful",

      token: employeeToken,

      user: {
        ...employeeData,
        id: employee.id,
        role: "employee",
        shopId: employee.shop_id,
      },

      shop: {
        id: shop.id,
        shopCode: shop.shopCode,
        slug: shop.slug,
        name: shop.name,
        ownerName: shop.ownerName,
        email: shop.email,
        phone: shop.phone,
        address: shop.address,
        city: shop.city,
        state: shop.state,
        country: shop.country,
        logo: shop.logo,
        favicon: shop.favicon,
        primaryColor: shop.primaryColor,
        secondaryColor: shop.secondaryColor,
      },

      mustChangePassword: false,
    });
  } catch (error) {
    logAuthError("SHOP LOGIN", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// 3. CUSTOMER REGISTRATION
//
// POST /api/auth/register
//
// Frontend sends:
//
// {
//   name,
//   email,
//   phone,
//   password,
//   address,
//   city,
//   shopId
// }
//
// Email/phone uniqueness is checked PER SHOP.
// ============================================================

export const register = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, email, phone, password, address, city, slug } = req.body;

    const normalizedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);
    const normalizedSlug = normalizeSlug(slug);

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!normalizedName) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!normalizedEmail) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!normalizedPhone) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }

    if (!password) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (password.length < 6) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // ----------------------------------------------------------
    // SLUG REQUIRED
    // ----------------------------------------------------------

    if (!normalizedSlug) {
      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Shop slug is required",
      });
    }

    // ----------------------------------------------------------
    // FIND SHOP BY SLUG
    // ----------------------------------------------------------

    const shop = await Shop.findOne({
      where: {
        slug: normalizedSlug,
      },
      transaction,
    });

    if (!shop) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Laundry shop not found",
      });
    }

    if (shop.isDeleted === true) {
      await transaction.rollback();

      return res.status(403).json({
        success: false,
        message: "This shop is no longer available",
      });
    }

    if (shop.isActive === false) {
      await transaction.rollback();

      return res.status(403).json({
        success: false,
        message: "This shop is inactive",
      });
    }

    // ----------------------------------------------------------
    // IMPORTANT
    //
    // Backend determines shopId.
    // Customer does NOT send shopId.
    // ----------------------------------------------------------

    const shopId = shop.id;

    // ----------------------------------------------------------
    // EMAIL CHECK
    //
    // email + shopId
    // ----------------------------------------------------------

    const existingEmail = await User.findOne({
      where: {
        email: normalizedEmail,
        shopId,
        role: "customer",
      },
      transaction,
    });

    if (existingEmail) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message: "An account with this email already exists in this shop.",
      });
    }

    // ----------------------------------------------------------
    // PHONE CHECK
    // ----------------------------------------------------------

    const existingPhone = await User.findOne({
      where: {
        phone: normalizedPhone,
        shopId,
        role: "customer",
      },
      transaction,
    });

    if (existingPhone) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message:
          "An account with this phone number already exists in this shop.",
      });
    }

    // ----------------------------------------------------------
    // CUSTOMER EMAIL CHECK
    // ----------------------------------------------------------

    const existingCustomerEmail = await Customer.findOne({
      where: {
        email: normalizedEmail,
        shopId,
      },
      transaction,
    });

    if (existingCustomerEmail) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message: "A customer with this email already exists in this shop.",
      });
    }

    // ----------------------------------------------------------
    // CUSTOMER PHONE CHECK
    // ----------------------------------------------------------

    const existingCustomerPhone = await Customer.findOne({
      where: {
        phone: normalizedPhone,
        shopId,
      },
      transaction,
    });

    if (existingCustomerPhone) {
      await transaction.rollback();

      return res.status(409).json({
        success: false,
        message:
          "A customer with this phone number already exists in this shop.",
      });
    }

    // ----------------------------------------------------------
    // HASH PASSWORD
    // ----------------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // ----------------------------------------------------------
    // CREATE USER
    // ----------------------------------------------------------

    const user = await User.create(
      {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,

        password: hashedPassword,

        role: "customer",

        shopId,

        isActive: true,

        mustChangePassword: false,
      },
      {
        transaction,
      },
    );

    // ----------------------------------------------------------
    // CREATE CUSTOMER
    // ----------------------------------------------------------

    const customer = await Customer.create(
      {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,

        address: address ? String(address).trim() : null,

        city: city ? String(city).trim() : null,

        shopId,
        userId: user.id,
      },
      {
        transaction,
      },
    );

    // ----------------------------------------------------------
    // COMMIT
    // ----------------------------------------------------------

    await transaction.commit();

    // ----------------------------------------------------------
    // TOKEN
    // ----------------------------------------------------------

    const token = generateToken(user, {
      slug: shop.slug,
    });

    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    return res.status(201).json({
      success: true,

      message: "Account created successfully",

      token,

      user: safeUser(user),

      customer: customer.toJSON ? customer.toJSON() : customer,

      shop: {
        id: shop.id,
        shopCode: shop.shopCode,
        slug: shop.slug,
        name: shop.name,
        ownerName: shop.ownerName,
        email: shop.email,
        phone: shop.phone,
        address: shop.address,
        city: shop.city,
        state: shop.state,
        country: shop.country,
        logo: shop.logo,
        favicon: shop.favicon,
        primaryColor: shop.primaryColor,
        secondaryColor: shop.secondaryColor,
      },
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Transaction rollback error:", rollbackError);
    }

    logAuthError("REGISTER", error);

    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Email or phone number is already registered in this shop.",
      });
    }

    if (error?.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: error.errors?.[0]?.message || "Invalid registration data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// ============================================================
// 4. FORGOT PASSWORD
//
// POST /api/auth/forgot-password
//
// Body:
//
// {
//   email,
//   slug
// }
//
// slug is optional for admin.
// slug is IMPORTANT for customer because the same email
// can exist in multiple shops.
// ============================================================

export const forgotPassword = async (req, res) => {
  try {
    const { email, slug } = req.body;

    const normalizedEmail = normalizeEmail(email);
    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    let user = null;

    // ========================================================
    // SHOP-SCOPED PASSWORD RESET
    // ========================================================

    if (normalizedSlug) {
      const shop = await Shop.findOne({
        where: {
          slug: normalizedSlug,
        },
      });

      if (!shop) {
        return res.status(404).json({
          success: false,
          message: "Laundry shop not found",
        });
      }

      user = await User.findOne({
        where: {
          email: normalizedEmail,
          shopId: shop.id,
        },
      });
    } else {
      // ======================================================
      // GLOBAL ADMIN / SUPER ADMIN
      // ======================================================

      user = await User.findOne({
        where: {
          email: normalizedEmail,
          role: {
            [Op.in]: ["admin", "super_admin"],
          },
        },
      });
    }

    // ----------------------------------------------------------
    // SECURITY:
    // Don't expose whether email exists.
    // ----------------------------------------------------------

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, an OTP has been sent.",
      });
    }

    if (user.isDeleted === true) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, an OTP has been sent.",
      });
    }

    // ========================================================
    // GENERATE OTP
    // ========================================================

    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpExpires = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    // ========================================================
    // SAVE OTP
    //
    // Your User model should have:
    //
    // resetOtp
    // resetOtpExpires
    // ========================================================

    user.resetOtp = otp;
    user.resetOtpExpires = otpExpires;

    await user.save();

    // ========================================================
    // DEVELOPMENT
    //
    // Replace console.log with email service later.
    // ========================================================

    console.log(`\nPASSWORD RESET OTP for ${normalizedEmail}: ${otp}\n`);

    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, an OTP has been sent.",

      // DEVELOPMENT ONLY
      // Remove this in production.
      ...(process.env.NODE_ENV !== "production"
        ? {
            otp,
          }
        : {}),
    });
  } catch (error) {
    logAuthError("FORGOT PASSWORD", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// 5. VERIFY RESET OTP
//
// POST /api/auth/verify-reset-otp
//
// Body:
//
// {
//   email,
//   otp,
//   slug
// }
// ============================================================

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp, slug } = req.body;

    const normalizedEmail = normalizeEmail(email);
    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    let user = null;

    // ========================================================
    // SHOP
    // ========================================================

    if (normalizedSlug) {
      const shop = await Shop.findOne({
        where: {
          slug: normalizedSlug,
        },
      });

      if (!shop) {
        return res.status(404).json({
          success: false,
          message: "Laundry shop not found",
        });
      }

      user = await User.findOne({
        where: {
          email: normalizedEmail,
          shopId: shop.id,
        },
      });
    } else {
      // ======================================================
      // GLOBAL ADMIN
      // ======================================================

      user = await User.findOne({
        where: {
          email: normalizedEmail,
          role: {
            [Op.in]: ["admin", "super_admin"],
          },
        },
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ========================================================
    // OTP CHECK
    // ========================================================

    if (!user.resetOtp || String(user.resetOtp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ========================================================
    // EXPIRY
    // ========================================================

    if (
      !user.resetOtpExpires ||
      new Date(user.resetOtpExpires).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    logAuthError("VERIFY OTP", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// 6. RESET PASSWORD USING OTP
//
// POST /api/auth/reset-password
//
// Body:
//
// {
//   email,
//   otp,
//   newPassword,
//   confirmPassword,
//   slug
// }
// ============================================================

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword, slug } = req.body;

    const normalizedEmail = normalizeEmail(email);
    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    let user = null;

    // ========================================================
    // SHOP USER
    // ========================================================

    if (normalizedSlug) {
      const shop = await Shop.findOne({
        where: {
          slug: normalizedSlug,
        },
      });

      if (!shop) {
        return res.status(404).json({
          success: false,
          message: "Laundry shop not found",
        });
      }

      user = await User.findOne({
        where: {
          email: normalizedEmail,
          shopId: shop.id,
        },
      });
    } else {
      // ======================================================
      // GLOBAL USER
      // ======================================================

      user = await User.findOne({
        where: {
          email: normalizedEmail,
          role: {
            [Op.in]: ["admin", "super_admin"],
          },
        },
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ========================================================
    // OTP
    // ========================================================

    if (!user.resetOtp || String(user.resetOtp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ========================================================
    // EXPIRY
    // ========================================================

    if (
      !user.resetOtpExpires ||
      new Date(user.resetOtpExpires).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // ========================================================
    // UPDATE PASSWORD
    //

    // Prefer model hook if User model hashes automatically.
    // Otherwise bcrypt hash manually.
    // ========================================================

    user.password = newPassword;

    // User model has no beforeUpdate hook — hash manually.
    // ========================================================

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;


    user.resetOtp = null;
    user.resetOtpExpires = null;

    user.mustChangePassword = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    logAuthError("RESET PASSWORD", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// 7. CREATE / CHANGE PASSWORD
//
// POST /api/auth/create-password
//
// Protected route.
//
// Used when admin/employee/customer has:
// mustChangePassword = true
//
// Body:
//
// {
//   currentPassword,
//   newPassword,
//   confirmPassword
// }
// ============================================================

export const createPassword = async (req, res) => {
  try {
    const userId = req.user?.id;

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // ========================================================
    // GET USER
    // ========================================================

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================================
    // VERIFY CURRENT PASSWORD
    // ========================================================

    const currentPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!currentPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // ========================================================
    // PREVENT SAME PASSWORD
    // ========================================================

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the current password",
      });
    }

    // ========================================================
    // HASH NEW PASSWORD
    // ========================================================

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ========================================================
    // UPDATE USER
    // ========================================================

    user.password = hashedPassword;
    user.mustChangePassword = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    logAuthError("CREATE PASSWORD", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// 8. GET CURRENT USER
//
// GET /api/auth/me
//
// Requires protect middleware.
// ============================================================

export const getMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Shop,
          as: "shop",
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDeleted === true) {
      return res.status(403).json({
        success: false,
        message: "Account has been deleted",
      });
    }

    return res.status(200).json({
      success: true,

      user: safeUser(user),

      shop: user.shop
        ? {
            id: user.shop.id,
            shopCode: user.shop.shopCode,
            slug: user.shop.slug,
            name: user.shop.name,
            logo: user.shop.logo,
            favicon: user.shop.favicon,
            primaryColor: user.shop.primaryColor,
            secondaryColor: user.shop.secondaryColor,
          }
        : null,
    });
  } catch (error) {
    logAuthError("GET ME", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ============================================================
// 9. LOGOUT
//
// JWT is stateless, so frontend removes token.
//
// POST /api/auth/logout
// ============================================================

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
