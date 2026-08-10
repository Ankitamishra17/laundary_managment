import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Token not found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token not found.",
      });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the right record — users table for platform accounts,
    // employees table for employee accounts
    let account;
    if (decoded.type === "employee") {
      account = await Employee.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });
      if (account && account.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Employee account is inactive.",
        });
      }
    } else {
      account = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });
      if (account && !account.isActive) {
        return res.status(403).json({
          success: false,
          message: "User account is inactive.",
        });
      }
    }

    if (!account) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // Attach account to request (req.user for employees, req.user for users)
    req.user = account;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export default protect;
