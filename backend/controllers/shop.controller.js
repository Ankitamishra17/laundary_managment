import bcrypt from "bcrypt";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import generatePassword from "../utils/generatePassword.js";

// create shop
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
      const lastNumber = parseInt(lastShop.shopCode.replace("SHOP", ""));

      shopCode = `SHOP${String(lastNumber + 1).padStart(3, "0")}`;
    }

    // ==========================
    // Generate Temporary Password
    // ==========================

    const temporaryPassword = generatePassword();

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // ==========================
    // Subscription Dates
    // ==========================

    const subscriptionStart = new Date();

    const subscriptionEnd = new Date(subscriptionStart);

    if (subscriptionPlan === "Monthly") {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    } else if (subscriptionPlan === "Yearly") {
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
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

//get all shop

export const getShops = async (req, res) => {
  try {
    const shops = await Shop.findAll({
      include: [
        {
          model: User,
          as: "users",
          attributes: ["id", "name", "email", "phone", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      total: shops.length,
      data: shops,
    });
  } catch (error) {
    console.error("Get Shops Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//get shop by id

export const getShopById = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findByPk(id, {
      include: [
        {
          model: User,
          as: "users",
          attributes: ["id", "name", "email", "phone", "role"],
        },
      ],
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error("Get Shop Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//update shop

export const updateShop = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      ownerName,
      phone,
      address,
      city,
      state,
      country,
      gstNumber,
      subscriptionPlan,
      subscriptionAmount,
    } = req.body;

    const shop = await Shop.findByPk(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // Update subscription end date if plan changes
    let subscriptionEnd = shop.subscriptionEnd;

    if (
      subscriptionPlan &&
      subscriptionPlan !== shop.subscriptionPlan
    ) {
      const startDate = new Date();

      subscriptionEnd = new Date(startDate);

      if (subscriptionPlan === "Monthly") {
        subscriptionEnd.setMonth(
          subscriptionEnd.getMonth() + 1
        );
      } else {
        subscriptionEnd.setFullYear(
          subscriptionEnd.getFullYear() + 1
        );
      }

      shop.subscriptionStart = startDate;
      shop.subscriptionEnd = subscriptionEnd;
    }

    await shop.update({
      name: name ?? shop.name,
      ownerName: ownerName ?? shop.ownerName,
      phone: phone ?? shop.phone,
      address: address ?? shop.address,
      city: city ?? shop.city,
      state: state ?? shop.state,
      country: country ?? shop.country,
      gstNumber: gstNumber ?? shop.gstNumber,
      subscriptionPlan:
        subscriptionPlan ?? shop.subscriptionPlan,
      subscriptionAmount:
        subscriptionAmount ?? shop.subscriptionAmount,
      subscriptionStart: shop.subscriptionStart,
      subscriptionEnd: subscriptionEnd,
    });

    return res.status(200).json({
      success: true,
      message: "Shop updated successfully.",
      data: shop,
    });
  } catch (error) {
    console.error("Update Shop Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


//delete shop

export const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findByPk(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // Deactivate Shop
    await shop.update({
      isActive: false,
      subscriptionStatus: "Cancelled",
    });

    // Deactivate Shop Admin
    await User.update(
      {
        isActive: false,
      },
      {
        where: {
          shopId: id,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Shop deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Shop Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
