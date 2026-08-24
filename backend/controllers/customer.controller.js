import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";

// ============================================================
// CUSTOMER — own profile
// GET /api/customers/me
// Returns the logged-in customer's profile record (address, city,
// default laundry) so the customer UI can show saved details.
// ============================================================
export const getMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { userId: req.user.id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found.",
      });
    }

    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error("Get Customer Profile Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// ADMIN — customers of my shop
// GET /api/customers?search=&shopId=
// Lists every customer who signed up / placed an order for the
// admin's shop, with their order count, so the admin can see the
// full customer information from the dashboard.
// ============================================================
export const getShopCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    // Shop admins and employees see only their own shop's customers; super
    // admins can optionally pass ?shopId= to scope, otherwise see everyone.
    // Employees live in the employees table (shop_id) while admins/customers
    // live in the users table (shopId) — accept both shapes.
    const shopId = req.user.shop_id ?? req.user.shopId;
    const where = {};
    if (shopId) {
      where.shopId = shopId;
    } else if (req.query.shopId) {
      where.shopId = Number(req.query.shopId);
    }

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
        { city: { [Op.like]: term } },
      ];
    }

    const customers = await Customer.findAll({
      where,
      attributes: {
        include: [
          // Number of orders this customer has placed at any shop
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM orders WHERE orders.customer_id = Customer.id)",
            ),
            "orderCount",
          ],
        ],
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone", "isActive"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("Get Shop Customers Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
