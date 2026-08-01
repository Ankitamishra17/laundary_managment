import bcrypt from "bcrypt";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import generatePassword from "../utils/generatePassword.js";

export const createShop = async (req, res) => {
  try {
    const {
      name,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      country,
      gstNumber,
      subscriptionPlan,
      subscriptionAmount,
    } = req.body;

    // Validation
    if (
      !name ||
      !ownerName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !subscriptionPlan ||
      !subscriptionAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    // Check email already exists
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    // ==========================
    // Generate Shop Code
    // ==========================

    const lastShop = await Shop.findOne({
      order: [["id", "DESC"]],
    });

    let shopCode = "SHOP001";

    if (lastShop) {
      const lastNumber = parseInt(
        lastShop.shopCode.replace("SHOP", "")
      );

      shopCode = `SHOP${String(lastNumber + 1).padStart(3, "0")}`;
    }

    // ==========================
    // Generate Temporary Password
    // ==========================

    const temporaryPassword = generatePassword();

    const hashedPassword = await bcrypt.hash(
      temporaryPassword,
      10
    );

    // ==========================
    // Subscription Dates
    // ==========================

    const subscriptionStart = new Date();

    const subscriptionEnd = new Date(subscriptionStart);

    if (subscriptionPlan === "Monthly") {
      subscriptionEnd.setMonth(
        subscriptionEnd.getMonth() + 1
      );
    } else if (subscriptionPlan === "Yearly") {
      subscriptionEnd.setFullYear(
        subscriptionEnd.getFullYear() + 1
      );
    }

    // ==========================
    // Create Shop
    // ==========================

    const shop = await Shop.create({
      shopCode,
      name,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      country: country || "India",
      gstNumber,
      subscriptionPlan,
      subscriptionAmount,
      subscriptionStart,
      subscriptionEnd,
      subscriptionStatus: "Active",
    });

    // ==========================
    // Create Shop Admin
    // ==========================

    const admin = await User.create({
      shopId: shop.id,
      name: ownerName,
      email,
      phone,
      password: hashedPassword,
      role: "admin",
      mustChangePassword: true,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Shop created successfully.",

      shop: {
        id: shop.id,
        shopCode: shop.shopCode,
        name: shop.name,
      },

      admin: {
        id: admin.id,
        email: admin.email,
        temporaryPassword,
      },
    });
  } catch (error) {
    console.error("Create Shop Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};