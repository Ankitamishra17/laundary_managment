import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

const protect = async (req, res, next) => {
  try {
    let token;

    // ============================================================
    // GET TOKEN FROM AUTHORIZATION HEADER
    // ============================================================

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ============================================================
    // TOKEN NOT FOUND
    // ============================================================

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token not found.",
      });
    }

    // ============================================================
    // VERIFY TOKEN
    // ============================================================

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let account;

    // ============================================================
    // EMPLOYEE
    // employees table has shop_id
    // Convert it to shopId in req.user
    // ============================================================

    if (decoded.type === "employee") {
      account = await Employee.findByPk(decoded.id, {
        attributes: {
          exclude: ["password"],
        },
      });

      if (!account) {
        return res.status(401).json({
          success: false,
          message: "Employee not found.",
        });
      }

      if (account.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Employee account is inactive.",
        });
      }

      // IMPORTANT:
      // Database/model field remains: shop_id
      // req.user will use: shopId
      req.user = {
        ...account.toJSON(),
        role: "employee",
        shopId: account.shop_id ?? null,
      };
    }

    // ============================================================
    // USER
    // super_admin / admin / customer
    // users table already has shopId
    // ============================================================

    else {
      account = await User.findByPk(decoded.id, {
        attributes: {
          exclude: ["password"],
        },
      });

      if (!account) {
        return res.status(401).json({
          success: false,
          message: "User not found.",
        });
      }

      if (!account.isActive) {
        return res.status(403).json({
          success: false,
          message: "User account is inactive.",
        });
      }

      req.user = {
        ...account.toJSON(),
        shopId: account.shopId ?? null,
      };
    }

    return next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

export default protect;