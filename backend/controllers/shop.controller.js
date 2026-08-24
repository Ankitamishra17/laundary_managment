import bcrypt from "bcrypt";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Service from "../models/Service.js";
import generatePassword from "../utils/generatePassword.js";

// Default services for every new shop so customers can immediately order.
const DEFAULT_SERVICES = [
  { serviceName: "Wash & Fold", category: "Washing", pricingType: "Per Kg", price: 80, estimatedTime: "24 hours", description: "Machine wash, tumble dry and neatly folded. Perfect for everyday clothes." },
  { serviceName: "Wash & Iron", category: "Washing", pricingType: "Per Kg", price: 99, estimatedTime: "24 hours", description: "Washed and pressed to perfection — crisp lines on every shirt and trouser." },
  { serviceName: "Dry Cleaning", category: "Dry Cleaning", pricingType: "Per Item", price: 149, estimatedTime: "48 hours", description: "Gentle chemical cleaning for suits, silk, wool and delicate fabrics." },
  { serviceName: "Iron Only", category: "Ironing", pricingType: "Per Item", price: 25, estimatedTime: "12 hours", description: "Professional steam pressing that removes every wrinkle and crease." },
  { serviceName: "Bedding & Household", category: "Household", pricingType: "Per Item", price: 120, estimatedTime: "48 hours", description: "Comforters, curtains and towels washed large-scale with extra care." },
  { serviceName: "Premium Care", category: "Premium", pricingType: "Per Item", price: 199, estimatedTime: "48 hours", description: "Stain treatment, fabric softener and hand-finishing for special pieces." },
];

async function seedServicesForShop(shopId, createdBy) {
  try {
    await Service.bulkCreate(
      DEFAULT_SERVICES.map((s) => ({
        ...s,
        shopId,
        status: "Active",
        isDeleted: false,
        createdBy: createdBy || 0,
      })),
    );
  } catch (err) {
    console.error("Failed to seed default services:", err.message);
  }
}

// ==========================================
// PUBLIC — list active shops (no auth)
// Used by the landing page & customer signup
// ==========================================
export const getPublicShops = async (req, res) => {
  try {
    const shops = await Shop.findAll({
      where: { isActive: true, subscriptionStatus: "Active" },
      attributes: [
        "id",
        "shopCode",
        "name",
        "address",
        "city",
        "state",
        "phone",
        "ownerName",
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

// ==========================================
// PUBLIC — active services of one shop (no auth)
// Used by the customer order page
// ==========================================
export const getPublicShopServices = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findOne({
      where: { id, isActive: true, subscriptionStatus: "Active" },
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

    // Auto-seed if the shop has no services yet.
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

// ==========================================
// CUSTOMER — the WashFlow laundry serving this customer
// Returns the customer's linked shop (or the platform default for new
// accounts) plus its active services, so the customer never has to pick
// a laundry themselves before browsing or ordering.
// ==========================================
export const getMyShopContext = async (req, res) => {
  try {
    let shop = null;

    // Prefer the customer's linked laundry when it's still active.
    if (req.user.shopId) {
      shop = await Shop.findOne({
        where: { id: req.user.shopId, isActive: true, subscriptionStatus: "Active" },
      });
    }

    // Otherwise fall back to WashFlow's first active laundry.
    if (!shop) {
      shop = await Shop.findOne({
        where: { isActive: true, subscriptionStatus: "Active" },
        order: [["createdAt", "ASC"]],
      });
    }

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "No laundry is available right now. Please check back soon.",
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

    // Safety net: if the shop has zero services (e.g. created after the
    // last server boot, or all services were deleted), auto-seed the
    // default catalog so customers can always place an order.
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
      data: { shop, services },
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
      planName,
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

    // Check email already exists in users table
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    // Check email already exists in shops table
    const existingShop = await Shop.findOne({
      where: { email },
    });

    if (existingShop) {
      return res.status(400).json({
        success: false,
        message: "A shop with this email already exists.",
      });
    }

    // Check phone already exists in shops table
    if (phone) {
      const existingPhone = await Shop.findOne({
        where: { phone },
      });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "A shop with this phone number already exists.",
        });
      }
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
      planName: planName || "Basic",
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

    // Immediately seed default services so customers can place orders
    // without waiting for the next server restart.
    await seedServicesForShop(shop.id, admin.id);

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
      where: { isActive: true, },
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
      planName: planName ?? shop.planName,
      logo: logo ?? shop.logo,
      favicon: favicon ?? shop.favicon,
      primaryColor: primaryColor ?? shop.primaryColor,
      secondaryColor: secondaryColor ?? shop.secondaryColor,
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
