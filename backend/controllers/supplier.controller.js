import Supplier from "../models/Supplier.js";

// ==========================================
// CREATE SUPPLIER
// ==========================================
export const createSupplier = async (req, res) => {
  try {
    const { name, phone, email, address, gstNumber } = req.body;

    const shopId = req.user.shopId;
    const createdBy = req.user.id;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Supplier name and phone are required.",
      });
    }

    // Check duplicate supplier in same shop
    const existingSupplier = await Supplier.findOne({
      where: {
        shopId,
        phone,
      },
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier with this phone number already exists.",
      });
    }

    const supplier = await Supplier.create({
      shopId,
      name,
      phone,
      email,
      address,
      gstNumber,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully.",
      data: supplier,
    });
  } catch (error) {
    console.error("Create Supplier Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create supplier.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL SUPPLIERS
// ==========================================
export const getSuppliers = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    const suppliers = await Supplier.findAll({
      where: {
        shopId,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    console.error("Get Suppliers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers.",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE SUPPLIER
// ==========================================
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;

    const supplier = await Supplier.findOne({
      where: {
        id,
        shopId,
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error("Get Supplier Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch supplier.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE SUPPLIER
// ==========================================
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;

    const { name, phone, email, address, gstNumber, isActive } = req.body;

    const supplier = await Supplier.findOne({
      where: {
        id,
        shopId,
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found.",
      });
    }

    await supplier.update({
      name,
      phone,
      email,
      address,
      gstNumber,
      isActive,
    });

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully.",
      data: supplier,
    });
  } catch (error) {
    console.error("Update Supplier Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update supplier.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE SUPPLIER
// ==========================================
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;

    const supplier = await Supplier.findOne({
      where: {
        id,
        shopId,
      },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found.",
      });
    }

    await supplier.destroy();

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Supplier Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete supplier.",
      error: error.message,
    });
  }
};
