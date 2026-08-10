import InventoryItem from "../models/InventoryItem.js";

// ==========================================
// CREATE INVENTORY ITEM
// ==========================================

export const createInventoryItem = async (req, res) => {
  try {
    console.log("Inventory Body:", req.body);
    console.log("Inventory User:", req.user);

    const {
      name,
      category,
      unit,
      currentStock,
      minStock,
      status,
    } = req.body;

    // Validate required fields
    if (!name || !category || !unit) {
      return res.status(400).json({
        success: false,
        message: "Name, category and unit are required.",
      });
    }

    // Get shop from logged-in user
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
      });
    }

    // Check duplicate item
    const existingItem = await InventoryItem.findOne({
      where: {
        shopId,
        name,
        isDeleted: false,
      },
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Inventory item already exists in this shop.",
      });
    }

    // Create item
    const item = await InventoryItem.create({
      shopId,
      name,
      category,
      unit,
      currentStock: Number(currentStock) || 0,
      minStock: Number(minStock) || 0,
      status: status || "Active",
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Inventory item created successfully.",
      data: item,
    });
  } catch (error) {
    console.error("Create Inventory Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET ALL INVENTORY ITEMS
// ==========================================

export const getInventoryItems = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop is not assigned to this user.",
      });
    }

    const items = await InventoryItem.findAll({
      where: {
        shopId,
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get Inventory Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET SINGLE INVENTORY ITEM
// ==========================================

export const getInventoryItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;

    const item = await InventoryItem.findOne({
      where: {
        id,
        shopId,
        isDeleted: false,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Get Inventory Item Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// UPDATE INVENTORY ITEM
// ==========================================

export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      category,
      unit,
      currentStock,
      minStock,
      status,
    } = req.body;

    const shopId = req.user.shopId;

    const item = await InventoryItem.findOne({
      where: {
        id,
        shopId,
        isDeleted: false,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    // Check duplicate name
    if (name && name !== item.name) {
      const duplicate = await InventoryItem.findOne({
        where: {
          shopId,
          name,
          isDeleted: false,
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another inventory item with this name already exists.",
        });
      }
    }

    await item.update({
      name: name ?? item.name,
      category: category ?? item.category,
      unit: unit ?? item.unit,
      currentStock:
        currentStock !== undefined
          ? Number(currentStock)
          : item.currentStock,
      minStock:
        minStock !== undefined
          ? Number(minStock)
          : item.minStock,
      status: status ?? item.status,
      updatedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Inventory item updated successfully.",
      data: item,
    });
  } catch (error) {
    console.error("Update Inventory Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// DELETE INVENTORY ITEM
// ==========================================

export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const shopId = req.user.shopId;

    const item = await InventoryItem.findOne({
      where: {
        id,
        shopId,
        isDeleted: false,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    // Soft delete
    await item.update({
      isDeleted: true,
      updatedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Inventory Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================================
// GET LOW STOCK ITEMS
// ==========================================

export const getLowStockItems = async (req, res) => {
  try {
    const shopId = req.user.shopId;

    const items = await InventoryItem.findAll({
      where: {
        shopId,
        isDeleted: false,
        status: "Active",
      },
    });

    // Filter items where current stock <= minimum stock
    const lowStockItems = items.filter(
      (item) =>
        Number(item.currentStock) <= Number(item.minStock)
    );

    return res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems,
    });
  } catch (error) {
    console.error("Low Stock Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
