import bcrypt from "bcrypt";
import slugify from "slugify";

import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import generatePassword from "../utils/generatePassword.js";
import Subscription from "../models/Subscription.js";

// ============================================================
// DEFAULT SERVICES
// Every new shop gets these services automatically
// ============================================================

// const DEFAULT_SERVICES = [
//   {
//     serviceName: "Wash & Fold",
//     category: "Washing",
//     pricingType: "Per Kg",
//     price: 80,
//     estimatedTime: "24 hours",
//     description:
//       "Machine wash, tumble dry and neatly folded. Perfect for everyday clothes.",
//   },
//   {
//     serviceName: "Wash & Iron",
//     category: "Washing",
//     pricingType: "Per Kg",
//     price: 99,
//     estimatedTime: "24 hours",
//     description:
//       "Washed and pressed to perfection — crisp lines on every shirt and trouser.",
//   },
//   {
//     serviceName: "Dry Cleaning",
//     category: "Dry Cleaning",
//     pricingType: "Per Item",
//     price: 149,
//     estimatedTime: "48 hours",
//     description:
//       "Gentle chemical cleaning for suits, silk, wool and delicate fabrics.",
//   },
//   {
//     serviceName: "Iron Only",
//     category: "Ironing",
//     pricingType: "Per Item",
//     price: 25,
//     estimatedTime: "12 hours",
//     description:
//       "Professional steam pressing that removes every wrinkle and crease.",
//   },
//   {
//     serviceName: "Bedding & Household",
//     category: "Household",
//     pricingType: "Per Item",
//     price: 120,
//     estimatedTime: "48 hours",
//     description:
//       "Comforters, curtains and towels washed large-scale with extra care.",
//   },
//   {
//     serviceName: "Premium Care",
//     category: "Premium",
//     pricingType: "Per Item",
//     price: 199,
//     estimatedTime: "48 hours",
//     description:
//       "Stain treatment, fabric softener and hand-finishing for special pieces.",
//   },
// ];

// ============================================================
// GENERATE UNIQUE SHOP SLUG
// Example:
// Neha Laundry          -> neha-laundry
// Neha Laundry again    -> neha-laundry-1
// Neha Laundry again    -> neha-laundry-2
// ============================================================

async function generateUniqueSlug(name, excludeShopId = null) {
  const baseSlug =
    slugify(name || "laundry", {
      lower: true,
      strict: true,
      trim: true,
    }) || "laundry";

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const where = { slug };

    const existingShop = await Shop.findOne({ where });

    if (
      !existingShop ||
      (excludeShopId && String(existingShop.id) === String(excludeShopId))
    ) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

// ============================================================
// SEED DEFAULT SERVICES
// ============================================================

// async function seedServicesForShop(shopId, createdBy) {
//   try {
//     await Service.bulkCreate(
//       DEFAULT_SERVICES.map((service) => ({
//         ...service,
//         shopId,
//         status: "Active",
//         isDeleted: false,
//         createdBy: createdBy || 0,
//       })),
//     );
//   } catch (err) {
//     console.error("Failed to seed default services:", err.message);
//   }
// }

// ============================================================
// PUBLIC — LIST ACTIVE SHOPS
// Used by landing page and customer signup
// ============================================================

export const getPublicShops = async (req, res) => {
  try {
    const shops = await Shop.findAll({
      where: {
        isActive: true,
        subscriptionStatus: "Active",
      },
      attributes: [
        "id",
        "shopCode",
        "slug",
        "name",
        "address",
        "city",
        "state",
        "phone",
        "ownerName",
        "logo",
        "primaryColor",
        "secondaryColor",
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      total: shops.length,
      data: shops,
    });
  } catch (error) {
    console.error("Get Public Shops Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// PUBLIC — GET ACTIVE SERVICES OF ONE SHOP
// ============================================================

export const getPublicShopServices = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findOne({
      where: {
        id,
        isActive: true,
        subscriptionStatus: "Active",
      },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Laundry not found.",
      });
    }

    let services = await Service.findAll({
      where: {
        shopId: shop.id,
        isDeleted: false,
        status: "Active",
      },
      order: [["createdAt", "DESC"]],
    });

    // Auto-seed default services if none exist
    if (services.length === 0) {
      await seedServicesForShop(shop.id, 0);

      services = await Service.findAll({
        where: {
          shopId: shop.id,
          isDeleted: false,
          status: "Active",
        },
        order: [["createdAt", "DESC"]],
      });
    }

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Get Public Shop Services Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// CUSTOMER — GET MY SHOP CONTEXT
// ============================================================
export const getMyShopContext = async (req, res) => {
  try {
    /* ----------------------------------------------------------
       TENANT RESOLUTION — STRICTLY SHOP-SCOPED

       A customer may only ever see the laundry their account is
       linked to (req.user.shopId). There is deliberately NO
       cross-tenant fallback: serving the "first active shop" would
       leak another shop's services and let a customer place an
       order into the wrong tenant.
    ---------------------------------------------------------- */

    if (!req.user.shopId) {
      return res.status(404).json({
        success: false,
        message:
          "Your account is not linked to a laundry. Please contact support.",
      });
    }

    const shop = await Shop.findOne({
      where: {
        id: Number(req.user.shopId),
        isActive: true,
        isDeleted: false,
        subscriptionStatus: "Active",
      },
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message:
          "Your laundry is currently unavailable. Please contact the shop directly.",
      });
    }

    let services = await Service.findAll({
      where: {
        shopId: shop.id,
        isDeleted: false,
        status: "Active",
      },
      order: [["createdAt", "ASC"]],
    });

    // Safety net
    if (services.length === 0) {
      await seedServicesForShop(shop.id, 0);

      services = await Service.findAll({
        where: {
          shopId: shop.id,
          isDeleted: false,
          status: "Active",
        },
        order: [["createdAt", "ASC"]],
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        shop,
        services,
      },
    });
  } catch (error) {
    console.error("Get Shop Context Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// CREATE SHOP
// ============================================================

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
      planName,
    } = req.body;

    // ========================================================
    // VALIDATION
    // ========================================================

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

    // ========================================================
    // CHECK EXISTING USER EMAIL
    // ========================================================

    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    // ========================================================
    // CHECK EXISTING SHOP EMAIL
    // ========================================================

    const existingShop = await Shop.findOne({
      where: { email },
    });

    if (existingShop) {
      return res.status(400).json({
        success: false,
        message: "A shop with this email already exists.",
      });
    }

    // ========================================================
    // CHECK EXISTING PHONE
    // ========================================================

    const existingPhone = await Shop.findOne({
      where: { phone },
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "A shop with this phone number already exists.",
      });
    }

    // ========================================================
    // GENERATE SHOP CODE
    // ========================================================

    const lastShop = await Shop.findOne({
      order: [["id", "DESC"]],
    });

    let shopCode = "SHOP001";

    if (lastShop?.shopCode) {
      const lastNumber = parseInt(lastShop.shopCode.replace("SHOP", ""), 10);

      if (!Number.isNaN(lastNumber)) {
        shopCode = `SHOP${String(lastNumber + 1).padStart(3, "0")}`;
      }
    }

    // ========================================================
    // GENERATE UNIQUE SLUG
    // ========================================================

    const slug = await generateUniqueSlug(name);

    // ========================================================
    // GENERATE TEMPORARY PASSWORD
    // ========================================================

    const temporaryPassword = generatePassword();

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // ========================================================
    // SUBSCRIPTION DATES
    // ========================================================

    const subscriptionStart = new Date();
    const subscriptionEnd = new Date(subscriptionStart);

    if (subscriptionPlan === "Monthly") {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    } else if (subscriptionPlan === "Yearly") {
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    }

    // ========================================================
    // CREATE SHOP
    // ========================================================

    const shop = await Shop.create({
      shopCode,
      slug,
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
      planName: planName || "Basic",
      subscriptionStart,
      subscriptionEnd,
      subscriptionStatus: "Active",
      isActive: true,
    });

    // ========================================================
    // CREATE SUBSCRIPTION
    // Automatically create subscription for new shop
    // ========================================================

    const subscription = await Subscription.create({
      shopId: shop.id,
      plan: subscriptionPlan,
      amount: subscriptionAmount,
      startDate: subscriptionStart,
      endDate: subscriptionEnd,
      status: "Active",
      paymentStatus: "Paid",
    });

    // ========================================================
    // CREATE SHOP ADMIN
    // ========================================================

    const admin = await User.create({
      shopId: shop.id,
      name: ownerName,
      email: email.trim().toLowerCase(),
      phone,
      password: hashedPassword,
      role: "admin",
      mustChangePassword: true,
      isActive: true,
      isDeleted: false,
    });

    // ========================================================
    // SEED DEFAULT SERVICES
    // ========================================================

    await seedServicesForShop(shop.id, admin.id);

    return res.status(201).json({
      success: true,
      message: "Shop created successfully.",

      shop: {
        id: shop.id,
        shopCode: shop.shopCode,
        slug: shop.slug,
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

// ============================================================
// GET ALL SHOPS
// ============================================================

export const getShops = async (req, res) => {
  try {
    const shops = await Shop.findAll({
      where: {
        isActive: true,
      },
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

// ============================================================
// GET SHOP BY ID
// ============================================================

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

// ============================================================
// UPDATE SHOP
// IMPORTANT:
// Slug is NOT automatically changed when the name changes.
// This prevents existing public links from breaking.
// ============================================================

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
      planName,
      logo,
      favicon,
      primaryColor,
      secondaryColor,
    } = req.body;

    const shop = await Shop.findByPk(id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }

    // ========================================================
    // CHECK PHONE DUPLICATE IF CHANGED
    // ========================================================

    if (phone && phone !== shop.phone) {
      const existingPhone = await Shop.findOne({
        where: { phone },
      });

      if (existingPhone && String(existingPhone.id) !== String(shop.id)) {
        return res.status(400).json({
          success: false,
          message: "A shop with this phone number already exists.",
        });
      }
    }

    // ========================================================
    // UPDATE SUBSCRIPTION DATE IF PLAN CHANGES
    // ========================================================

    let subscriptionEnd = shop.subscriptionEnd;
    let subscriptionStart = shop.subscriptionStart;

    if (subscriptionPlan && subscriptionPlan !== shop.subscriptionPlan) {
      subscriptionStart = new Date();
      subscriptionEnd = new Date(subscriptionStart);

      if (subscriptionPlan === "Monthly") {
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
      } else if (subscriptionPlan === "Yearly") {
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
      }
    }

    // ========================================================
    // UPDATE SHOP
    // ========================================================

    await shop.update({
      name: name ?? shop.name,
      ownerName: ownerName ?? shop.ownerName,
      phone: phone ?? shop.phone,
      address: address ?? shop.address,
      city: city ?? shop.city,
      state: state ?? shop.state,
      country: country ?? shop.country,
      gstNumber: gstNumber ?? shop.gstNumber,
      subscriptionPlan: subscriptionPlan ?? shop.subscriptionPlan,
      subscriptionAmount: subscriptionAmount ?? shop.subscriptionAmount,
      planName: planName ?? shop.planName,
      logo: logo ?? shop.logo,
      favicon: favicon ?? shop.favicon,
      primaryColor: primaryColor ?? shop.primaryColor,
      secondaryColor: secondaryColor ?? shop.secondaryColor,
      subscriptionStart,
      subscriptionEnd,
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

// ============================================================
// DELETE / DEACTIVATE SHOP
// ============================================================

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

    // Deactivate shop
    await shop.update({
      isActive: false,
      subscriptionStatus: "Cancelled",
    });

    // Deactivate all users belonging to this shop
    await User.update(
      {
        isActive: false,
      },
      {
        where: {
          shopId: id,
        },
      },
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

// ============================================================
// GET SHOP BY SLUG
// Used for:
// /shop/:slug
// /shop/:slug/login
// /shop/:slug/signup
// ============================================================

export const getShopBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const shop = await Shop.findOne({
      where: {
        slug: String(slug).trim().toLowerCase(),
        isActive: true,
      },
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
    console.error("Get Shop By Slug Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
