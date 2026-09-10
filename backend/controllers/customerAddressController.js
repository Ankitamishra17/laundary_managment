import Customer from "../models/Customer.js";
import CustomerAddress from "../models/CustomerAddress.js";

// ============================================================
// HELPER — resolve the customer row for the logged-in user
// ============================================================

const resolveCustomer = async (userId) => {
  return Customer.findOne({ where: { userId } });
};

// ============================================================
// ADD ADDRESS
// POST /api/customer/address
// ============================================================

export const addAddress = async (req, res) => {
  try {
    const customer = await resolveCustomer(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    // Basic validation
    if (!fullName?.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }
    if (!addressLine1?.trim()) {
      return res.status(400).json({ success: false, message: "Address line 1 is required." });
    }
    if (!city?.trim()) {
      return res.status(400).json({ success: false, message: "City is required." });
    }
    if (!state?.trim()) {
      return res.status(400).json({ success: false, message: "State is required." });
    }
    if (!postalCode?.trim()) {
      return res.status(400).json({ success: false, message: "Postal code is required." });
    }

    // If marking this as default, unset all existing defaults first
    if (isDefault) {
      await CustomerAddress.update(
        { isDefault: false },
        { where: { customerId: customer.id } }
      );
    }

    // If this is the first address, force it to be default
    const existingCount = await CustomerAddress.count({
      where: { customerId: customer.id },
    });
    const shouldBeDefault = existingCount === 0 ? true : !!isDefault;

    const address = await CustomerAddress.create({
      customerId: customer.id,
      shopId: customer.shopId,
      label: label || "Home",
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2?.trim() || null,
      landmark: landmark?.trim() || null,
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country?.trim() || "India",
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully.",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET ALL ADDRESSES
// GET /api/customer/address
// ============================================================

export const getAddresses = async (req, res) => {
  try {
    const customer = await resolveCustomer(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const addresses = await CustomerAddress.findAll({
      where: { customerId: customer.id },
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET SINGLE ADDRESS
// GET /api/customer/address/:id
// ============================================================

export const getAddressById = async (req, res) => {
  try {
    const customer = await resolveCustomer(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const address = await CustomerAddress.findOne({
      where: {
        id: Number(req.params.id),
        customerId: customer.id,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// UPDATE ADDRESS
// PUT /api/customer/address/:id
// ============================================================

export const updateAddress = async (req, res) => {
  try {
    const customer = await resolveCustomer(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const address = await CustomerAddress.findOne({
      where: {
        id: Number(req.params.id),
        customerId: customer.id,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    // Basic validation
    if (!fullName?.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }
    if (!addressLine1?.trim()) {
      return res.status(400).json({ success: false, message: "Address line 1 is required." });
    }
    if (!city?.trim()) {
      return res.status(400).json({ success: false, message: "City is required." });
    }
    if (!state?.trim()) {
      return res.status(400).json({ success: false, message: "State is required." });
    }
    if (!postalCode?.trim()) {
      return res.status(400).json({ success: false, message: "Postal code is required." });
    }

    // If marking as default, unset all others first
    if (isDefault && !address.isDefault) {
      await CustomerAddress.update(
        { isDefault: false },
        { where: { customerId: customer.id } }
      );
    }

    address.label = label || address.label;
    address.fullName = fullName.trim();
    address.phone = phone.trim();
    address.addressLine1 = addressLine1.trim();
    address.addressLine2 = addressLine2?.trim() || null;
    address.landmark = landmark?.trim() || null;
    address.city = city.trim();
    address.state = state.trim();
    address.postalCode = postalCode.trim();
    address.country = country?.trim() || address.country;
    address.isDefault = isDefault ?? address.isDefault;

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DELETE ADDRESS
// DELETE /api/customer/address/:id
// ============================================================

export const deleteAddress = async (req, res) => {
  try {
    const customer = await resolveCustomer(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const address = await CustomerAddress.findOne({
      where: {
        id: Number(req.params.id),
        customerId: customer.id,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const wasDefault = address.isDefault;
    await address.destroy();

    // If the deleted address was default, make the most recent one default
    if (wasDefault) {
      const mostRecent = await CustomerAddress.findOne({
        where: { customerId: customer.id },
        order: [["createdAt", "DESC"]],
      });

      if (mostRecent) {
        mostRecent.isDefault = true;
        await mostRecent.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// SET DEFAULT ADDRESS
// PATCH /api/customer/address/:id/default
// ============================================================

export const setDefaultAddress = async (req, res) => {
  try {
    const customer = await resolveCustomer(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const address = await CustomerAddress.findOne({
      where: {
        id: Number(req.params.id),
        customerId: customer.id,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    // Unset all defaults for this customer
    await CustomerAddress.update(
      { isDefault: false },
      { where: { customerId: customer.id } }
    );

    // Set the selected one as default
    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated.",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
