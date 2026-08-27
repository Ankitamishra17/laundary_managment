import Customer from "../models/Customer.js";
import User from "../models/User.js";

export async function findOrCreateCustomer(userId) {
  let customer = await Customer.findOne({ where: { userId } });
  if (customer) return customer;

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

  try {
    // Check if a Customer already exists with the same email (unique constraint)
    const existingByEmail = user.email
      ? await Customer.findOne({ where: { email: user.email } })
      : null;

    if (existingByEmail) {
      existingByEmail.userId = user.id;
      if (!existingByEmail.shopId && user.shopId) {
        existingByEmail.shopId = user.shopId;
      }
      await existingByEmail.save();
      return existingByEmail;
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
      if (user.email) {
        customer = await Customer.findOne({ where: { email: user.email } });
      }
      if (!customer && user.phone) {
        customer = await Customer.findOne({ where: { phone: user.phone } });
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