import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Service from "../models/Service.js";

// ============================================================
// DEFAULT SERVICES SEEDER
// ============================================================
// A shop whose catalog is missing the standard services shows almost
// nothing to customers, which looks like "I can only order Wash".
// This seeder gives every active shop the standard WashFlow catalog
// (wash, iron, dry clean, ...): any default service the shop doesn't
// already have by name is added on boot. Existing services are never
// touched or renamed, so custom catalogs stay intact and the admin
// can always add/customise more from the Services page.
// ============================================================

const DEFAULT_SERVICES = [
  {
    serviceName: "Wash & Fold",
    category: "Washing",
    pricingType: "Per Kg",
    price: 80,
    estimatedTime: "24 hours",
    description:
      "Machine wash, tumble dry and neatly folded. Perfect for everyday clothes.",
  },
  {
    serviceName: "Wash & Iron",
    category: "Washing",
    pricingType: "Per Kg",
    price: 99,
    estimatedTime: "24 hours",
    description:
      "Washed and pressed to perfection — crisp lines on every shirt and trouser.",
  },
  {
    serviceName: "Dry Cleaning",
    category: "Dry Cleaning",
    pricingType: "Per Item",
    price: 149,
    estimatedTime: "48 hours",
    description:
      "Gentle chemical cleaning for suits, silk, wool and delicate fabrics.",
  },
  {
    serviceName: "Iron Only",
    category: "Ironing",
    pricingType: "Per Item",
    price: 25,
    estimatedTime: "12 hours",
    description:
      "Professional steam pressing that removes every wrinkle and crease.",
  },
  {
    serviceName: "Bedding & Household",
    category: "Household",
    pricingType: "Per Item",
    price: 120,
    estimatedTime: "48 hours",
    description:
      "Comforters, curtains and towels washed large-scale with extra care.",
  },
  {
    serviceName: "Premium Care",
    category: "Premium",
    pricingType: "Per Item",
    price: 199,
    estimatedTime: "48 hours",
    description:
      "Stain treatment, fabric softener and hand-finishing for special pieces.",
  },
];

const seedDefaultServices = async () => {
  try {
    const shops = await Shop.findAll({ where: { isActive: true } });

    for (const shop of shops) {
      const existing = await Service.findAll({
        where: { shopId: shop.id, isDeleted: false },
        attributes: ["serviceName"],
      });
      const existingNames = new Set(
        existing.map((s) => String(s.serviceName).trim().toLowerCase()),
      );

      const missing = DEFAULT_SERVICES.filter(
        (s) => !existingNames.has(String(s.serviceName).trim().toLowerCase()),
      );
      if (missing.length === 0) continue;

      // Services.createdBy is NOT NULL — fall back to the shop admin or 0.
      const admin = await User.findOne({
        where: { shopId: shop.id, role: "admin" },
        attributes: ["id"],
      });
      const createdBy = admin ? admin.id : 0;

      await Service.bulkCreate(
        missing.map((s) => ({
          ...s,
          shopId: shop.id,
          status: "Active",
          isDeleted: false,
          createdBy,
        })),
      );

      console.log(
        `  + added ${missing.length} default services for shop "${shop.name}"`,
      );
    }
  } catch (error) {
    console.error(" Default Services Seeder Error:", error.message);
  }
};

export default seedDefaultServices;
