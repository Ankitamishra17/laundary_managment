import { Op } from "sequelize";
import Service from "../models/Service.js";
import { getPagination } from "../utils/pagination.js";

/* =====================================================
   Create Service
===================================================== */

export const createService = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("USER:", req.user);

  try {
    const {
      serviceName,
      category,
      pricingType,
      price,
      estimatedTime,
      description,
      status,
    } = req.body;

    const shopId = req.user.shopId;

    if (!serviceName || !category || !pricingType || !price || !estimatedTime) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    // Prevent duplicate service
    const existingService = await Service.findOne({
      where: {
        shopId,
        serviceName,
        isDeleted: false,
      },
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "Service already exists in this shop.",
      });
    }

    const service = await Service.create({
      shopId,
      serviceName,
      category,
      pricingType,
      price,
      estimatedTime,
      description,
      status: status || "Active",
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      data: service,
    });
  } catch (error) {
    console.error("Create Service Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Get All Services
===================================================== */

export const getServices = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req);

    const { search, category, status } = req.query;

    const where = {
      shopId: req.user.shopId,
      isDeleted: false,
    };

    if (search) {
      where.serviceName = {
        [Op.like]: `%${search}%`,
      };
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    const { rows, count } = await Service.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Get Service By Id
===================================================== */

export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({
      where: {
        id: req.params.id,
        shopId: req.user.shopId,
        isDeleted: false,
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Update Service
===================================================== */

export const updateService = async (req, res) => {
  try {
    const {
      serviceName,
      category,
      pricingType,
      price,
      estimatedTime,
      description,
      status,
    } = req.body;

    const service = await Service.findOne({
      where: {
        id: req.params.id,
        shopId: req.user.shopId,
        isDeleted: false,
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const existingService = await Service.findOne({
      where: {
        shopId: req.user.shopId,
        serviceName,
        isDeleted: false,
        id: {
          [Op.ne]: service.id,
        },
      },
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "Service already exists in this shop.",
      });
    }

    await service.update({
      serviceName,
      category,
      pricingType,
      price,
      estimatedTime,
      description,
      status,
      updatedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      data: service,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Soft Delete Service
===================================================== */

export const deleteService = async (req, res) => {
  try {
    const service = await Service.findOne({
      where: {
        id: req.params.id,
        shopId: req.user.shopId,
        isDeleted: false,
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    await service.update({
      isDeleted: true,
      deletedBy: req.user.id,
      deletedAt: new Date(),
      status: "Inactive",
    });

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   Toggle Status
===================================================== */

export const toggleStatus = async (req, res) => {
  try {
    const service = await Service.findOne({
      where: {
        id: req.params.id,
        shopId: req.user.shopId,
        isDeleted: false,
      },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    service.status = service.status === "Active" ? "Inactive" : "Active";

    service.updatedBy = req.user.id;

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      data: service,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
