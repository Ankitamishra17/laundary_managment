import Customer from "../models/Customer.js";
import User from "../models/User.js";

/**
 * Tenant-scoped: finds/creates the Customer profile for a user **within
 * the user's own shop**. Customers are per-shop rows (unique on
 * shopId + email / shopId + phone), so every dedup lookup below is
 * constrained to the user's shopId — a user of Shop A can never be
 * linked to a customer row of Shop B.
 */
export async function findOrCreateCustomer(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    console.error(`findOrCreateCustomer: No User found for userId=${userId}`);
    return null;
  }

  // Log instead of silently skipping when role doesn't match
  if (user.role !== "customer") {
    console.error(
      `findOrCreateCustomer: User ${userId} has role "${user.role}", expected "customer". Not creating profile.`
    );
    return null;
  }

  // ------------------------------------------------------------
  // Tenant-scoped lookup: customer row already linked to this user
  // in their own shop.
  // ------------------------------------------------------------
  const shopScopedWhere = { userId: Number(userId) };
  if (user.shopId) {
    shopScopedWhere.shopId = Number(user.shopId);
  }

  let customer = await Customer.findOne({ where: shopScopedWhere });
  if (customer) return customer;

  try {
    // ----------------------------------------------------------
    // Dedup within the SAME SHOP only (never across tenants).
    // The unique indexes are (shopId, email) and (shopId, phone),
    // so the fallback lookups must match that scoping.
    // ----------------------------------------------------------
    let existing = null;

    if (user.email && user.shopId) {
      existing = await Customer.findOne({
        where: { shopId: user.shopId, email: user.email },
      });
    }

    if (!existing && user.phone && user.shopId) {
      existing = await Customer.findOne({
        where: { shopId: user.shopId, phone: user.phone },
      });
    }

    if (existing) {
      existing.userId = user.id;
      if (!existing.shopId && user.shopId) {
        existing.shopId = user.shopId;
      }
      await existing.save();
      return existing;
    }

    customer = await Customer.create({
      userId: user.id,
      shopId: user.shopId || null,
      name: user.name || "Customer",
      email: user.email || null,
      phone: user.phone || null,
      isActive: true,
    });

    return customer;
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      // Retry the dedup lookup — still scoped to the user's shop.
      if (user.email && user.shopId) {
        customer = await Customer.findOne({
          where: { shopId: user.shopId, email: user.email },
        });
      }
      if (!customer && user.phone && user.shopId) {
        customer = await Customer.findOne({
          where: { shopId: user.shopId, phone: user.phone },
        });
      }
      if (customer) {
        customer.userId = user.id;
        if (!customer.shopId && user.shopId) {
          customer.shopId = user.shopId;
        }
        await customer.save();
      } else {
        console.error(
          `findOrCreateCustomer: Unique constraint hit for userId=${userId} but no matching Customer found by email/phone.`
        );
      }
    } else {
      // THIS is the key fix — log the FULL error, not just message,
      // so you can see exactly which field failed validation.
      console.error(
        `findOrCreateCustomer: Failed to create Customer for userId=${userId}.`,
        err.name,
        err.errors ? err.errors.map(e => e.message) : err.message
      );
    }
    return customer || null;
  }
}