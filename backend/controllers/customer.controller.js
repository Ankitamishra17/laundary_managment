import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";

// ============================================================
// CUSTOMER — GET OWN PROFILE
// GET /api/customers/me
// ============================================================

export const getMyProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        userId: req.user.id,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone", "isActive", "shopId"],
          required: false,
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get Customer Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get customer profile.",
    });
  }
};

// ============================================================
// GET CUSTOMER BY ID
// GET /api/customers/:id
// ============================================================

export const getCustomerById = async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!customerId || Number.isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const customer = await Customer.findByPk(customerId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone", "isActive", "shopId"],
          required: false,
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(`
              (
                SELECT COUNT(*)
                FROM orders
                WHERE orders.customer_id = Customer.id
              )
            `),
            "orderCount",
          ],
        ],
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // --------------------------------------------------------
    // ADMIN / EMPLOYEE SECURITY
    // Customer should belong to the logged-in user's shop
    // --------------------------------------------------------

    const loggedInShopId = req.user?.shopId ?? req.user?.shop_id ?? null;

    if (
      (req.user?.role === "admin" || req.user?.role === "employee") &&
      Number(customer.shopId) !== Number(loggedInShopId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this customer.",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get Customer By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get customer.",
    });
  }
};

// ============================================================
// ADMIN / EMPLOYEE / SUPER ADMIN — GET CUSTOMERS
// GET /api/customers?search=&shopId=
// ============================================================

export const getShopCustomers = async (req, res) => {
  try {
    const { search, shopId: queryShopId } = req.query;

    const where = {};

    // ========================================================
    // GET LOGGED-IN USER'S SHOP
    // ========================================================

    const loggedInShopId = req.user?.shopId ?? req.user?.shop_id ?? null;

    // ========================================================
    // ADMIN
    // Only customers from ADMIN'S OWN SHOP
    // ========================================================

    if (req.user?.role === "admin") {
      if (!loggedInShopId) {
        return res.status(400).json({
          success: false,
          message: "No shop is assigned to this admin.",
        });
      }

      where.shopId = Number(loggedInShopId);
    }

    // ========================================================
    // EMPLOYEE
    // Only customers from EMPLOYEE'S OWN SHOP
    // ========================================================

    if (req.user?.role === "employee") {
      if (!loggedInShopId) {
        return res.status(400).json({
          success: false,
          message: "No shop is assigned to this employee.",
        });
      }

      where.shopId = Number(loggedInShopId);
    }

    // ========================================================
    // SUPER ADMIN
    // Can see all customers
    // Optional: filter by ?shopId=
    // ========================================================

    if (req.user?.role === "super_admin" && queryShopId) {
      where.shopId = Number(queryShopId);
    }

    // ========================================================
    // SEARCH
    // ========================================================

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;

      where[Op.or] = [
        {
          name: {
            [Op.like]: term,
          },
        },
        {
          email: {
            [Op.like]: term,
          },
        },
        {
          phone: {
            [Op.like]: term,
          },
        },
        {
          city: {
            [Op.like]: term,
          },
        },
      ];
    }

    // ========================================================
    // GET CUSTOMERS
    // ========================================================

    const customers = await Customer.findAll({
      where,

      attributes: {
        include: [
          [
            sequelize.literal(`
              (
                SELECT COUNT(*)
                FROM orders
                WHERE orders.customer_id = Customer.id
              )
            `),
            "orderCount",
          ],
        ],
      },

      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone", "isActive", "shopId"],
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

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load customers.",
    });
  }
};
