import { Op, literal } from "sequelize";

import Task from "../models/Tasks.js";
import Employee from "../models/Employee.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Shop from "../models/Shop.js";

import {
  createNotification,
  notifyShopAdmins,
  notifyCustomer,
} from "./notification.controller.js";

/* ============================================================
   CONSTANTS
============================================================ */

const TASK_TYPES = ["pickup", "wash", "dry", "iron", "pack", "delivery"];

const TASK_TYPE_LABELS = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry Cleaning",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

const TASK_SEQUENCE = ["pickup", "wash", "dry", "iron", "pack", "delivery"];

const TASK_SEQUENCE_MAP = {
  pickup: 1,
  wash: 2,
  dry: 3,
  iron: 4,
  pack: 5,
  delivery: 6,
};

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  picked_up: "Picked Up",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ORDER_STATUS_RANK = {
  pending: 0,
  picked_up: 1,
  processing: 2,
  ready_for_delivery: 3,
  out_for_delivery: 4,
  delivered: 5,
  cancelled: 6,
};

/* ============================================================
   AUTH / TENANT HELPERS
============================================================ */

const getShopId = (req) => {
  const shopId = req.user?.shopId;

  if (!shopId) {
    return null;
  }

  return Number(shopId);
};

const getEmployeeId = (req) => {
  if (req.user?.role !== "employee") {
    return null;
  }

  return Number(req.user.id);
};

const requireShop = (req, res) => {
  const shopId = getShopId(req);

  if (!shopId) {
    res.status(403).json({
      success: false,
      message: "Shop context is required.",
    });

    return null;
  }

  return shopId;
};

const requireEmployeeContext = (req, res) => {
  const shopId = getShopId(req);
  const employeeId = getEmployeeId(req);

  if (!shopId || !employeeId) {
    res.status(403).json({
      success: false,
      message: "Employee shop context is missing.",
    });

    return null;
  }

  return {
    shopId,
    employeeId,
  };
};

/* ============================================================
   VALIDATION HELPERS
============================================================ */

const isValidTaskType = (taskType) => {
  return TASK_TYPES.includes(taskType);
};

const getTaskSequence = (taskType) => {
  return TASK_SEQUENCE_MAP[taskType] || null;
};

const getTaskLabel = (taskType) => {
  return TASK_TYPE_LABELS[taskType] || taskType;
};

const getStatusLabel = (status) => {
  return ORDER_STATUS_LABELS[status] || status;
};

/* ============================================================
   TASK QUERY HELPERS
============================================================ */

/**
 * Get all tasks belonging to one order and one shop.
 *
 * IMPORTANT:
 * Always use shop_id together with order_id.
 */
const getOrderTasksSorted = async (orderId, shopId) => {
  return Task.findAll({
    where: {
      order_id: Number(orderId),
      shop_id: Number(shopId),
    },

    order: [
      ["sequence", "ASC"],
      ["id", "ASC"],
    ],
  });
};

/**
 * Get latest task of each task type.
 *
 * Normally there should be only one task type per order,
 * but this helper also safely handles old duplicate data.
 */
const latestTasksByType = (tasks) => {
  const map = {};

  for (const task of tasks) {
    if (
      !map[task.task_type] ||
      Number(task.id) > Number(map[task.task_type].id)
    ) {
      map[task.task_type] = task;
    }
  }

  return map;
};

/**
 * Check whether all PREVIOUS EXISTING workflow tasks
 * are completed.
 *
 * Missing task types are ignored.
 *
 * Example:
 *
 * pickup = completed
 * wash   = completed
 * dry    = pending
 * iron   = missing
 * pack   = missing
 *
 * dry is allowed to start.
 */
const previousTasksCompleted = (taskType, tasks) => {
  const currentSequence = getTaskSequence(taskType);

  if (!currentSequence) {
    return false;
  }

  const latest = latestTasksByType(tasks);

  return TASK_SEQUENCE.every((type) => {
    const sequence = getTaskSequence(type);

    if (sequence >= currentSequence) {
      return true;
    }

    const previousTask = latest[type];

    // Task type was not assigned.
    if (!previousTask) {
      return true;
    }

    return previousTask.status === "completed";
  });
};

/**
 * Find next existing task after current task.
 */
const findNextTask = (taskType, tasks) => {
  const currentSequence = getTaskSequence(taskType);

  if (!currentSequence) {
    return null;
  }

  const latest = latestTasksByType(tasks);

  for (const type of TASK_SEQUENCE) {
    const sequence = getTaskSequence(type);

    if (sequence <= currentSequence) {
      continue;
    }

    const nextTask = latest[type];

    if (nextTask && nextTask.status !== "completed") {
      return nextTask;
    }
  }

  return null;
};

/**
 * Find the first existing task in the order workflow.
 */
const findFirstTask = (tasks) => {
  const latest = latestTasksByType(tasks);

  for (const type of TASK_SEQUENCE) {
    if (latest[type] && latest[type].status !== "completed") {
      return latest[type];
    }
  }

  return null;
};

/**
 * Determine whether a task is ready to start.
 *
 * This does NOT change database status.
 *
 * pending + isReady=true
 * means employee can start it.
 */
const isTaskReady = (task, tasks) => {
  if (!task) {
    return false;
  }

  if (task.status === "completed") {
    return false;
  }

  if (task.status === "in_progress") {
    return true;
  }

  return previousTasksCompleted(task.task_type, tasks);
};

/* ============================================================
   ORDER STATUS
============================================================ */

/**
 * Calculate order status from the complete task workflow.
 *
 * Correct workflow:
 *
 * Pickup started/completed
 *      ↓
 * Processing
 *      ↓
 * Pack completed
 *      ↓
 * Ready for delivery
 *      ↓
 * Delivery started
 *      ↓
 * Delivered
 */
const calculateOrderStatus = (tasks, currentOrderStatus) => {
  if (!tasks || tasks.length === 0) {
    return currentOrderStatus;
  }

  const latest = latestTasksByType(tasks);

  // Delivery completed
  if (latest.delivery?.status === "completed") {
    return "delivered";
  }

  // Delivery started
  if (latest.delivery?.status === "in_progress") {
    return "out_for_delivery";
  }

  // Packing completed
  if (latest.pack?.status === "completed") {
    return "ready_for_delivery";
  }

  // Any processing task started/completed
  const processingTypes = ["wash", "dry", "iron"];

  const processingStarted = processingTypes.some((type) => {
    return (
      latest[type] && ["in_progress", "completed"].includes(latest[type].status)
    );
  });

  if (processingStarted) {
    return "processing";
  }

  // Pickup completed or started
  if (
    latest.pickup &&
    ["in_progress", "completed"].includes(latest.pickup.status)
  ) {
    return "picked_up";
  }

  return currentOrderStatus || "pending";
};

/* ============================================================
   ADMIN WHERE
============================================================ */

const buildTaskWhereForAdmin = (req, extra = {}) => {
  const where = {
    ...extra,
  };

  const shopId = getShopId(req);

  /*
   * Super admin:
   * shopId can be null, therefore cross-shop access is allowed.
   *
   * Shop admin:
   * shopId is present, therefore strictly scoped.
   */
  if (shopId) {
    where.shop_id = shopId;
  }

  return where;
};

/* ============================================================
   EMPLOYEE WHERE
============================================================ */

const buildTaskWhereForEmployee = (req, extra = {}) => {
  const shopId = getShopId(req);
  const employeeId = getEmployeeId(req);

  return {
    ...extra,
    shop_id: shopId,
    employee_id: employeeId,
  };
};

/* ============================================================
   ADMIN — GET ALL TASKS
   GET /api/tasks
============================================================ */

export const getAllTasks = async (req, res) => {
  try {
    const { employee_id, status, task_type, order_id } = req.query;

    const where = buildTaskWhereForAdmin(req);

    if (employee_id) {
      where.employee_id = Number(employee_id);
    }

    if (order_id) {
      where.order_id = Number(order_id);
    }

    if (status) {
      where.status = status;
    }

    if (task_type) {
      if (!isValidTaskType(task_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task_type.",
        });
      }

      where.task_type = task_type;
    }

    const tasks = await Task.findAll({
      where,

      include: [
        {
          model: Employee,
          as: "employee",

          attributes: ["id", "name", "email", "designation", "shop_id"],

          required: false,
        },

        {
          model: Order,
          as: "order",

          attributes: [
            "id",
            "status",
            "total_amount",
            "pickup_address",
            "delivery_address",
            "shop_id",
          ],

          required: false,
        },
      ],

      order: [
        ["sequence", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get All Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — ASSIGN TASKS
   POST /api/tasks

   NEW BODY:

   {
     "order_id": 101,
     "assignments": [
       {
         "employee_id": 5,
         "task_types": ["pickup", "delivery"]
       },
       {
         "employee_id": 7,
         "task_types": ["wash", "dry"]
       },
       {
         "employee_id": 8,
         "task_types": ["iron", "pack"]
       }
     ],
     "scheduled_time": "2026-09-03T10:00:00",
     "priority": "normal",
     "notes": "Handle carefully"
   }

============================================================ */

export const assignTask = async (req, res) => {
  try {
    const adminShopId = getShopId(req);

    if (!adminShopId) {
      return res.status(403).json({
        success: false,
        message: "A shop context is required to assign tasks.",
      });
    }

    const shop = await Shop.findByPk(adminShopId, {
      attributes: ["id", "slug"],
    });

    if (!shop?.slug) {
      return res.status(403).json({
        success: false,
        message: "Shop slug is missing.",
      });
    }

    const shopSlug = shop.slug;

    if (!adminShopId) {
      return res.status(403).json({
        success: false,
        message: "A shop context is required to assign tasks.",
      });
    }

    const {
      order_id,
      assignments,
      customer_name,
      customer_phone,
      customer_address,
      scheduled_time,
      priority,
      notes,

      // Backward compatibility
      employee_id,
      task_type,
      task_types,
    } = req.body;

    /* --------------------------------------------------------
       SCHEDULED TIME
    -------------------------------------------------------- */

    if (!scheduled_time) {
      return res.status(400).json({
        success: false,
        message: "scheduled_time is required.",
      });
    }

    const scheduledDate = new Date(scheduled_time);

    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduled_time.",
      });
    }

    if (scheduledDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time cannot be in the past.",
      });
    }

    /* --------------------------------------------------------
       BUILD ASSIGNMENTS
    -------------------------------------------------------- */

    let normalizedAssignments = [];

    /*
     * NEW FORMAT
     */
    if (Array.isArray(assignments) && assignments.length > 0) {
      normalizedAssignments = assignments;
    } else if (employee_id) {
      /*
       * OLD FORMAT SUPPORT
       *
       * This prevents your old frontend/API from immediately breaking.
       *
       * Old:
       *
       * employee_id: 5
       * task_types: ["pickup", "wash"]
       */
      let oldTypes = [];

      if (Array.isArray(task_types) && task_types.length > 0) {
        oldTypes = task_types;
      } else if (task_type) {
        oldTypes = [task_type];
      }

      if (oldTypes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide assignments[] or task_type/task_types.",
        });
      }

      normalizedAssignments = [
        {
          employee_id: Number(employee_id),
          task_types: oldTypes,
        },
      ];
    } else {
      return res.status(400).json({
        success: false,
        message:
          "assignments is required. Example: [{ employee_id, task_types }].",
      });
    }

    /* --------------------------------------------------------
       NORMALIZE + VALIDATE ASSIGNMENTS
    -------------------------------------------------------- */

    const assignmentMap = new Map();

    for (const assignment of normalizedAssignments) {
      const assignedEmployeeId = Number(assignment?.employee_id);

      if (!assignedEmployeeId) {
        return res.status(400).json({
          success: false,
          message: "Each assignment requires employee_id.",
        });
      }

      let types = assignment?.task_types;

      if (!Array.isArray(types)) {
        types = assignment?.task_type ? [assignment.task_type] : [];
      }

      if (types.length === 0) {
        return res.status(400).json({
          success: false,
          message: `No task types provided for employee ${assignedEmployeeId}.`,
        });
      }

      for (const type of types) {
        if (!isValidTaskType(type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid task_type: ${type}`,
          });
        }

        /*
         * Same task type cannot be assigned to two employees
         * in the same request.
         */
        if (assignmentMap.has(type)) {
          return res.status(400).json({
            success: false,
            message: `${getTaskLabel(type)} is assigned to more than one employee.`,
          });
        }

        assignmentMap.set(type, assignedEmployeeId);
      }
    }

    /*
     * Sort by actual workflow sequence.
     */
    const typesToCreate = [...assignmentMap.keys()].sort(
      (a, b) => getTaskSequence(a) - getTaskSequence(b),
    );

    if (typesToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one task is required.",
      });
    }

    /* --------------------------------------------------------
       VALIDATE PRIORITY
    -------------------------------------------------------- */

    const validPriorities = ["normal", "urgent"];

    const resolvedPriority = priority || "normal";

    if (!validPriorities.includes(resolvedPriority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority.",
      });
    }

    /* --------------------------------------------------------
       FIND ORDER — STRICT TENANT
    -------------------------------------------------------- */

    let resolvedOrderId = order_id ? Number(order_id) : null;

    let order = null;

    let resolvedName = String(customer_name || "").trim();

    let resolvedPhone = String(customer_phone || "").trim() || null;

    let resolvedAddress = String(customer_address || "").trim() || null;

    if (resolvedOrderId) {
      order = await Order.findOne({
        where: {
          id: resolvedOrderId,
          shop_id: adminShopId,
        },

        include: [
          {
            model: Customer,
            as: "customer",

            attributes: [
              "id",
              "userId",
              "name",
              "phone",
              "address",
              "city",
              "shopId",
            ],

            required: false,
          },
        ],
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found in your shop.",
        });
      }

      if (order.status === "delivered" || order.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: `Cannot assign tasks to a ${order.status} order.`,
        });
      }

      /*
       * Tenant consistency check.
       */
      if (
        order.customer?.shopId &&
        Number(order.customer.shopId) !== adminShopId
      ) {
        return res.status(403).json({
          success: false,
          message: "Customer does not belong to this shop.",
        });
      }

      /*
       * Existing tasks.
       */
      const existingTasks = await Task.findAll({
        where: {
          shop_id: adminShopId,
          order_id: resolvedOrderId,
        },

        attributes: ["id", "task_type", "employee_id", "status", "sequence"],
      });

      /*
       * IMPORTANT:
       *
       * One task type = one task for one order.
       *
       * If wash already exists, do NOT create another wash
       * for another employee.
       *
       * Use REASSIGN endpoint to change employee.
       */
      const existingTypes = new Set(
        existingTasks.map((task) => task.task_type),
      );

      const duplicateTypes = typesToCreate.filter((type) =>
        existingTypes.has(type),
      );

      if (duplicateTypes.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            `These tasks are already assigned for this order: ` +
            duplicateTypes.map(getTaskLabel).join(", ") +
            `. Use reassign instead.`,
        });
      }

      /*
       * Legacy order.employee_id.
       *
       * Keep this only for compatibility with your existing Order model.
       */
      if (!order.employee_id && typesToCreate.length > 0) {
        const firstEmployeeId = assignmentMap.get(typesToCreate[0]);

        order.employee_id = Number(firstEmployeeId);

        await order.save();
      }

      /* ------------------------------------------------------
         AUTO CUSTOMER DATA
      ------------------------------------------------------ */

      if (!resolvedName) {
        resolvedName =
          order.customer?.name ||
          String(order.pickup_address || "").trim() ||
          `Order #${order.id}`;
      }

      if (!resolvedPhone) {
        resolvedPhone = order.customer?.phone || null;
      }

      if (!resolvedAddress) {
        resolvedAddress =
          String(
            order.customer
              ? [order.customer.address, order.customer.city]
                  .filter(Boolean)
                  .join(", ")
              : "",
          ).trim() ||
          order.pickup_address ||
          null;
      }
    }

    if (!resolvedName) {
      return res.status(400).json({
        success: false,
        message: "customer_name is required when order_id is not provided.",
      });
    }

    /* --------------------------------------------------------
       VALIDATE ALL EMPLOYEES
    -------------------------------------------------------- */

    const employeeIds = [...new Set([...assignmentMap.values()].map(Number))];

    const employees = await Employee.findAll({
      where: {
        id: {
          [Op.in]: employeeIds,
        },

        shop_id: adminShopId,

        status: "active",
      },
    });

    if (employees.length !== employeeIds.length) {
      const foundIds = new Set(
        employees.map((employee) => Number(employee.id)),
      );

      const invalidEmployeeIds = employeeIds.filter((id) => !foundIds.has(id));

      return res.status(404).json({
        success: false,
        message:
          `Employee(s) not found in your shop or inactive: ` +
          invalidEmployeeIds.join(", "),
      });
    }

    /* --------------------------------------------------------
       CREATE TASKS
    -------------------------------------------------------- */

    const createdTasks = [];

    /*
     * First task starts immediately.
     *
     * Example:
     *
     * pickup -> in_progress
     * wash   -> pending
     * dry    -> pending
     * iron   -> pending
     * pack   -> pending
     * delivery -> pending
     */
    const firstTaskType = typesToCreate[0];

    for (let index = 0; index < typesToCreate.length; index++) {
      const type = typesToCreate[index];

      const employeeId = Number(assignmentMap.get(type));

      /*
       * Scheduled time follows workflow sequence,
       * not assignment array order.
       */
      const spacedTime = new Date(
        scheduledDate.getTime() + index * 30 * 60 * 1000,
      );

      const isFirstTask = type === firstTaskType;

      const task = await Task.create({
        shop_id: adminShopId,

        employee_id: employeeId,

        order_id: resolvedOrderId,

        customer_name: resolvedName,

        customer_phone: resolvedPhone,

        customer_address: resolvedAddress,

        task_type: type,

        sequence: getTaskSequence(type),

        scheduled_time: spacedTime,

        priority: resolvedPriority,

        status: isFirstTask ? "in_progress" : "pending",

        activated_at: isFirstTask ? new Date() : null,

        started_at: isFirstTask ? new Date() : null,

        completed_at: null,

        notes: notes || null,
      });

      createdTasks.push(task);
    }

    /* --------------------------------------------------------
       UPDATE ORDER STATUS
    -------------------------------------------------------- */

    if (order) {
      const allTasks = await getOrderTasksSorted(resolvedOrderId, adminShopId);

      const newOrderStatus = calculateOrderStatus(allTasks, order.status);

      if (
        newOrderStatus &&
        newOrderStatus !== order.status &&
        newOrderStatus !== "cancelled"
      ) {
        const currentRank = ORDER_STATUS_RANK[order.status] ?? 0;

        const newRank = ORDER_STATUS_RANK[newOrderStatus] ?? 0;

        if (newRank >= currentRank) {
          order.status = newOrderStatus;

          await order.save();
        }
      }
    }

    /* --------------------------------------------------------
       EMPLOYEE NOTIFICATIONS
    -------------------------------------------------------- */

    for (const task of createdTasks) {
      const employeeId = Number(task.employee_id);

      const employee = employees.find((item) => Number(item.id) === employeeId);

      const taskLabel = getTaskLabel(task.task_type);

      const scheduledLabel = new Date(task.scheduled_time).toLocaleString([], {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      const readyText =
        task.status === "in_progress"
          ? "It is ready to start now."
          : "It will become ready after the previous task is completed.";

      try {
        await createNotification({
          shopId: adminShopId,
          employeeId,

          orderId: resolvedOrderId,

          taskId: task.id,

          title:
            task.status === "in_progress"
              ? "New task ready"
              : "New task assigned",

          message:
            `${taskLabel} task for ${resolvedName}` +
            `${
              resolvedOrderId ? ` (Order #${resolvedOrderId})` : ""
            } is scheduled for ${scheduledLabel}. ` +
            readyText,

          type: "task",

          link: `/${shopSlug}/employee/mytask`,
        });
      } catch (notificationError) {
        console.error(
          "Employee notification error:",
          notificationError.message,
        );
      }
    }

    /* --------------------------------------------------------
       ADMIN NOTIFICATION
    -------------------------------------------------------- */

    try {
      await notifyShopAdmins(adminShopId, {
        title: "Tasks assigned",

        message: `${createdTasks.length} task${
          createdTasks.length > 1 ? "s" : ""
        } assigned for ${
          resolvedOrderId ? `Order #${resolvedOrderId}` : resolvedName
        }.`,

        type: "task",

        link: "/admin/tasks",
      });
    } catch (notificationError) {
      console.error("Admin notification error:", notificationError.message);
    }

    /* --------------------------------------------------------
       CUSTOMER NOTIFICATION
    -------------------------------------------------------- */

    if (resolvedOrderId) {
      try {
        const orderWithCustomer = await Order.findOne({
          where: {
            id: resolvedOrderId,
            shop_id: adminShopId,
          },

          include: [
            {
              model: Customer,
              as: "customer",

              attributes: ["id", "userId", "name", "shopId"],

              required: false,
            },
          ],
        });

        if (orderWithCustomer?.customer) {
          await notifyCustomer(orderWithCustomer.customer, {
            title: "Order task updated",

            message: `Tasks have been assigned for your order #${resolvedOrderId}.`,

            type: "task",

            orderId: resolvedOrderId,

            link: `/customer/orders/${resolvedOrderId}`,
          });
        }
      } catch (notificationError) {
        console.error(
          "Customer notification error:",
          notificationError.message,
        );
      }
    }

    /* --------------------------------------------------------
       RETURN FULL CREATED TASKS
    -------------------------------------------------------- */

    const responseTasks = await Task.findAll({
      where: {
        id: {
          [Op.in]: createdTasks.map((task) => task.id),
        },

        shop_id: adminShopId,
      },

      include: [
        {
          model: Employee,
          as: "employee",

          attributes: ["id", "name", "email", "designation", "shop_id"],
        },

        {
          model: Order,
          as: "order",

          attributes: ["id", "status", "total_amount", "shop_id"],

          required: false,
        },
      ],

      order: [["sequence", "ASC"]],
    });

    return res.status(201).json({
      success: true,

      message: `${responseTasks.length} task${
        responseTasks.length > 1 ? "s" : ""
      } created successfully.`,

      data: responseTasks.length === 1 ? responseTasks[0] : responseTasks,
    });
  } catch (error) {
    console.error("Assign Task Error:", error);

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: error.errors?.[0]?.message || error.message,
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "This task is already assigned for this order.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — MY TASKS
   GET /api/tasks/my-tasks
============================================================ */

export const getMyTasks = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const { status, type, date } = req.query;

    const where = {
      shop_id: shopId,
      employee_id: employeeId,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      if (!isValidTaskType(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task type.",
        });
      }

      where.task_type = type;
    }

    if (date) {
      const start = new Date(`${date}T00:00:00`);

      const end = new Date(`${date}T23:59:59`);

      where.scheduled_time = {
        [Op.between]: [start, end],
      };
    }

    const tasks = await Task.findAll({
      where,

      include: [
        {
          model: Order,
          as: "order",

          attributes: [
            "id",
            "status",
            "total_amount",
            "pickup_address",
            "delivery_address",
            "shop_id",
          ],

          required: false,
        },
      ],

      order: [
        [literal("CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END"), "ASC"],

        ["sequence", "ASC"],

        ["scheduled_time", "ASC"],

        ["createdAt", "DESC"],
      ],
    });

    /*
     * Calculate isReady for each task.
     */
    const orderCache = new Map();

    const response = [];

    for (const task of tasks) {
      let orderTasks = [];

      if (task.order_id) {
        const cacheKey = `${shopId}-${task.order_id}`;

        if (!orderCache.has(cacheKey)) {
          const allTasks = await getOrderTasksSorted(task.order_id, shopId);

          orderCache.set(cacheKey, allTasks);
        }

        orderTasks = orderCache.get(cacheKey);
      }

      const data = task.toJSON();

      data.isReady = isTaskReady(task, orderTasks);

      response.push(data);
    }

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Get My Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — MY TASK STATS
   GET /api/tasks/my-tasks/stats
============================================================ */

export const getMyTaskStats = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const { date } = req.query;

    const where = {
      shop_id: shopId,
      employee_id: employeeId,
    };

    if (date) {
      const start = new Date(`${date}T00:00:00`);

      const end = new Date(`${date}T23:59:59`);

      where.scheduled_time = {
        [Op.between]: [start, end],
      };
    }

    const [total, pending, inProgress, completed] = await Promise.all([
      Task.count({ where }),

      Task.count({
        where: {
          ...where,
          status: "pending",
        },
      }),

      Task.count({
        where: {
          ...where,
          status: "in_progress",
        },
      }),

      Task.count({
        where: {
          ...where,
          status: "completed",
        },
      }),
    ]);

    return res.status(200).json({
      success: true,

      data: {
        total,
        pending,
        inProgress,
        completed,
      },
    });
  } catch (error) {
    console.error("Get My Task Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — GET SINGLE TASK
   GET /api/tasks/:id
============================================================ */

export const getTaskById = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const taskId = Number(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      where: {
        id: taskId,
        shop_id: shopId,
        employee_id: employeeId,
      },

      include: [
        {
          model: Employee,
          as: "employee",

          attributes: ["id", "name", "email", "designation", "shop_id"],

          required: false,
        },

        {
          model: Order,
          as: "order",

          attributes: [
            "id",
            "status",
            "total_amount",
            "shop_id",
            "pickup_address",
            "delivery_address",
            "pickup_date",
            "pickup_time",
            "delivery_date",
            "delivery_note",
          ],

          required: false,

          include: [
            {
              model: Customer,
              as: "customer",

              attributes: [
                "id",
                "userId",
                "name",
                "email",
                "phone",
                "address",
                "city",
                "shopId",
              ],

              required: false,
            },
          ],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    /*
     * Extra tenant verification.
     */
    if (task.employee && Number(task.employee.shop_id) !== shopId) {
      return res.status(403).json({
        success: false,
        message: "Task employee does not belong to this shop.",
      });
    }

    if (task.order && Number(task.order.shop_id) !== shopId) {
      return res.status(403).json({
        success: false,
        message: "Task order does not belong to this shop.",
      });
    }

    let isReady = false;

    if (task.order_id) {
      const allTasks = await getOrderTasksSorted(task.order_id, shopId);

      isReady = isTaskReady(task, allTasks);
    }

    const data = task.toJSON();

    data.isReady = isReady;

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Task By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — UPDATE TASK STATUS
   PATCH /api/tasks/:id/status

   BODY:

   {
     "status": "in_progress"
   }

   OR

   {
     "status": "completed"
   }

============================================================ */

export const updateTaskStatus = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;
    const shop = await Shop.findByPk(shopId, {
      attributes: ["id", "slug"],
    });

    if (!shop?.slug) {
      return res.status(403).json({
        success: false,
        message: "Shop slug is missing.",
      });
    }

    const shopSlug = shop.slug;

    const taskId = Number(req.params.id);

    const { status } = req.body;

    const allowedStatuses = ["pending", "in_progress", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    const task = await Task.findOne({
      where: {
        id: taskId,
        shop_id: shopId,
        employee_id: employeeId,
      },

      include: [
        {
          model: Employee,
          as: "employee",

          attributes: ["id", "name", "shop_id"],

          required: false,
        },

        {
          model: Order,
          as: "order",

          attributes: [
            "id",
            "status",
            "shop_id",
            "delivery_time",
            "customer_id",
          ],

          required: false,

          include: [
            {
              model: Customer,
              as: "customer",

              attributes: ["id", "userId", "name", "shopId"],

              required: false,
            },
          ],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    /* --------------------------------------------------------
       TENANT VALIDATION
    -------------------------------------------------------- */

    if (task.employee && Number(task.employee.shop_id) !== shopId) {
      return res.status(403).json({
        success: false,
        message: "Task employee does not belong to this shop.",
      });
    }

    if (task.order && Number(task.order.shop_id) !== shopId) {
      return res.status(403).json({
        success: false,
        message: "Task order does not belong to this shop.",
      });
    }

    /* --------------------------------------------------------
       INVALID TRANSITIONS
    -------------------------------------------------------- */

    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed task cannot be changed.",
      });
    }

    if (task.status === status) {
      return res.status(200).json({
        success: true,
        message: "Task already has this status.",
        data: task,
      });
    }

    /* --------------------------------------------------------
       GET ORDER TASKS
    -------------------------------------------------------- */

    let allOrderTasks = [];

    if (task.order_id) {
      allOrderTasks = await getOrderTasksSorted(task.order_id, shopId);
    }

    /* --------------------------------------------------------
       SEQUENCE VALIDATION
    -------------------------------------------------------- */

    if (task.order_id && (status === "in_progress" || status === "completed")) {
      const canStart = previousTasksCompleted(task.task_type, allOrderTasks);

      if (!canStart) {
        const blockingTasks = allOrderTasks
          .filter((item) => {
            const itemSequence = getTaskSequence(item.task_type);

            const currentSequence = getTaskSequence(task.task_type);

            return (
              itemSequence < currentSequence && item.status !== "completed"
            );
          })
          .map((item) => getTaskLabel(item.task_type));

        return res.status(400).json({
          success: false,
          message:
            `Cannot start this task yet. ` +
            `Complete these first: ` +
            blockingTasks.join(", "),
        });
      }
    }

    /* --------------------------------------------------------
       ONE ACTIVE TASK PER EMPLOYEE
    -------------------------------------------------------- */

    if (status === "in_progress") {
      const existingActive = await Task.findOne({
        where: {
          shop_id: shopId,

          employee_id: employeeId,

          status: "in_progress",

          id: {
            [Op.ne]: task.id,
          },
        },
      });

      if (existingActive) {
        /*
         * Pause current active task.
         */
        existingActive.status = "pending";

        await existingActive.save();

        try {
          await createNotification({
             shopId,
            employeeId,

            taskId: existingActive.id,

            orderId: existingActive.order_id,

            title: "Task paused",

            message: `Your ${getTaskLabel(
              existingActive.task_type,
            )} task has been paused because another task was started.`,

            type: "task",

            link: `/${shopSlug}/employee/mytask`,
          });
        } catch (notificationError) {
          console.error("Pause notification error:", notificationError.message);
        }
      }
    }

    /* --------------------------------------------------------
       LIFECYCLE TIMESTAMPS
    -------------------------------------------------------- */

    if (status === "in_progress") {
      if (!task.started_at) {
        task.started_at = new Date();
      }

      if (!task.activated_at) {
        task.activated_at = new Date();
      }
    }

    if (status === "completed") {
      if (!task.started_at) {
        task.started_at = new Date();
      }

      if (!task.activated_at) {
        task.activated_at = new Date();
      }

      if (!task.completed_at) {
        task.completed_at = new Date();
      }
    }

    task.status = status;

    await task.save();

    /* --------------------------------------------------------
       REFRESH ORDER TASKS
    -------------------------------------------------------- */

    if (task.order_id) {
      allOrderTasks = await getOrderTasksSorted(task.order_id, shopId);
    }

    /* --------------------------------------------------------
       FIND NEXT TASK
    -------------------------------------------------------- */

    let nextTask = null;

    if (status === "completed" && task.order_id) {
      nextTask = findNextTask(task.task_type, allOrderTasks);
    }

    /* --------------------------------------------------------
       DO NOT AUTOMATICALLY START DIFFERENT EMPLOYEE
       TASK.
    -------------------------------------------------------- */

    /*
     * Important:
     *
     * If Employee A completes pickup
     * and Employee B owns wash,
     *
     * wash remains pending.
     *
     * But API returns isReady=true.
     *
     * Employee B can now click Start.
     */

    let nextTaskReady = false;

    if (nextTask) {
      nextTaskReady = isTaskReady(nextTask, allOrderTasks);
    }

    /* --------------------------------------------------------
       ORDER STATUS UPDATE
    -------------------------------------------------------- */

    let freshOrder = null;

    if (task.order_id) {
      freshOrder = await Order.findOne({
        where: {
          id: task.order_id,
          shop_id: shopId,
        },

        include: [
          {
            model: Customer,
            as: "customer",

            attributes: ["id", "userId", "name", "shopId"],

            required: false,
          },
        ],
      });
    }

    const previousOrderStatus =
      freshOrder?.status || task.order?.status || null;

    if (freshOrder && freshOrder.status !== "cancelled") {
      const calculatedStatus = calculateOrderStatus(
        allOrderTasks,
        freshOrder.status,
      );

      const currentRank = ORDER_STATUS_RANK[freshOrder.status] ?? 0;

      const calculatedRank = ORDER_STATUS_RANK[calculatedStatus] ?? 0;

      if (calculatedStatus && calculatedRank > currentRank) {
        freshOrder.status = calculatedStatus;

        if (calculatedStatus === "delivered") {
          freshOrder.delivery_time = new Date().toISOString();
        }

        await freshOrder.save();
      }
    }

    /* --------------------------------------------------------
       ADMIN NOTIFICATION
    -------------------------------------------------------- */

    const taskLabel = getTaskLabel(task.task_type);

    const employeeName = task.employee?.name || "An employee";

    const actionWord =
      status === "completed"
        ? "completed"
        : status === "in_progress"
          ? "started"
          : "updated";

    const orderReference = task.order_id ? ` for order #${task.order_id}` : "";

    try {
      await notifyShopAdmins(shopId, {
        title: "Task update from employee",

        message:
          `${employeeName} ${actionWord} ` +
          `the ${taskLabel} task${orderReference}.`,

        type: "task",

        link: "/admin/tasks",
      });
    } catch (notificationError) {
      console.error(
        "Admin task notification error:",
        notificationError.message,
      );
    }

    /* --------------------------------------------------------
       NEXT EMPLOYEE NOTIFICATION
    -------------------------------------------------------- */

    if (
      status === "completed" &&
      nextTask &&
      nextTask.employee_id &&
      Number(nextTask.employee_id) !== employeeId
    ) {
      const completedLabel = getTaskLabel(task.task_type);

      const nextLabel = getTaskLabel(nextTask.task_type);

      const customerName =
        task.customer_name || task.order?.customer?.name || "the customer";

      try {
        await createNotification({
           shopId,
          employeeId: Number(nextTask.employee_id),

          taskId: nextTask.id,

          orderId: task.order_id,

          title: `${completedLabel} completed — ${nextLabel} is ready`,

          message:
            `${completedLabel} completed by ` +
            `${employeeName} for ${customerName}'s ` +
            `Order #${task.order_id}. ` +
            `Your ${nextLabel} task is now ready to start.`,

          type: "task",

          link: `/${shopSlug}/employee/mytask`,
        });
      } catch (notificationError) {
        console.error(
          "Next employee notification error:",
          notificationError.message,
        );
      }
    }

    /* --------------------------------------------------------
       CUSTOMER NOTIFICATION
    -------------------------------------------------------- */

    const effectiveOrder = freshOrder || task.order;

    if (effectiveOrder && effectiveOrder.customer) {
      const currentOrderStatus = effectiveOrder.status;

      const orderId = effectiveOrder.id;

      try {
        /*
         * Delivery completed
         */
        if (task.task_type === "delivery" && status === "completed") {
          await notifyCustomer(effectiveOrder.customer, {
            title: "Order delivered",

            message: `Your order #${orderId} has been delivered successfully.`,

            type: "order",

            orderId,

            link: "/customer/reviews",
          });
        } else if (previousOrderStatus !== currentOrderStatus) {
          /*
           * Order status changed
           */
          await notifyCustomer(effectiveOrder.customer, {
            title: "Order updated",

            message:
              `Your order #${orderId} is now ` +
              `${getStatusLabel(currentOrderStatus)}.`,

            type: "order",

            orderId,

            link: `/customer/orders/${orderId}`,
          });
        }
      } catch (notificationError) {
        console.error(
          "Customer task notification error:",
          notificationError.message,
        );
      }
    }

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    const responseTask = task.toJSON();

    responseTask.isReady = isTaskReady(task, allOrderTasks);

    if (nextTask) {
      responseTask.nextTask = {
        id: nextTask.id,

        task_type: nextTask.task_type,

        task_label: getTaskLabel(nextTask.task_type),

        employee_id: nextTask.employee_id,

        status: nextTask.status,

        isReady: nextTaskReady,
      };
    } else {
      responseTask.nextTask = null;
    }

    return res.status(200).json({
      success: true,

      message: "Task status updated successfully.",

      data: responseTask,
    });
  } catch (error) {
    console.error("Update Task Status Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — UPDATE NOTES
   PATCH /api/tasks/:id/notes
============================================================ */

export const updateTaskNotes = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const task = await Task.findOne({
      where: {
        id: Number(req.params.id),
        shop_id: shopId,
        employee_id: employeeId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    task.notes = req.body.notes ?? task.notes;

    await task.save();

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Update Task Notes Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — GET ORDER TASKS
   GET /api/tasks/order/:orderId
============================================================ */

export const getOrderTasks = async (req, res) => {
  try {
    const shopId = requireShop(req, res);

    if (!shopId) return;

    const orderId = Number(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    /*
     * STRICT ORDER TENANT CHECK
     */
    const order = await Order.findOne({
      where: {
        id: orderId,
        shop_id: shopId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const tasks = await Task.findAll({
      where: {
        order_id: orderId,
        shop_id: shopId,
      },

      include: [
        {
          model: Employee,
          as: "employee",

          attributes: ["id", "name", "email", "designation", "shop_id"],
        },
      ],

      order: [
        ["sequence", "ASC"],
        ["id", "ASC"],
      ],
    });

    const response = tasks.map((task) => {
      const data = task.toJSON();

      data.isReady = isTaskReady(task, tasks);

      return data;
    });

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Get Order Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — REASSIGN TASK
   PATCH /api/tasks/:id/reassign

   BODY:

   {
     "employee_id": 8
   }

============================================================ */

export const reassignTask = async (req, res) => {
  try {
    const shopId = requireShop(req, res);

    if (!shopId) return;

    const shop = await Shop.findByPk(shopId, {
      attributes: ["id", "slug"],
    });

    if (!shop?.slug) {
      return res.status(403).json({
        success: false,
        message: "Shop slug is missing.",
      });
    }

    const shopSlug = shop.slug;

    if (!shopId) return;

    const newEmployeeId = Number(req.body.employee_id);

    if (!newEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "employee_id is required.",
      });
    }

    const taskId = Number(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    /* --------------------------------------------------------
       TASK — STRICT SHOP
    -------------------------------------------------------- */

    const task = await Task.findOne({
      where: {
        id: taskId,
        shop_id: shopId,
      },

      include: [
        {
          model: Employee,
          as: "employee",

          attributes: ["id", "name", "shop_id"],

          required: false,
        },

        {
          model: Order,
          as: "order",

          attributes: ["id", "shop_id"],

          required: false,
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    /* --------------------------------------------------------
       COMPLETED TASK
    -------------------------------------------------------- */

    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot reassign a completed task.",
      });
    }

    /* --------------------------------------------------------
       NEW EMPLOYEE — STRICT SHOP
    -------------------------------------------------------- */

    const newEmployee = await Employee.findOne({
      where: {
        id: newEmployeeId,

        shop_id: shopId,

        status: "active",
      },
    });

    if (!newEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in your shop or employee is inactive.",
      });
    }

    /* --------------------------------------------------------
       ALREADY SAME EMPLOYEE
    -------------------------------------------------------- */

    if (Number(task.employee_id) === newEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Task is already assigned to this employee.",
      });
    }

    /* --------------------------------------------------------
       DUPLICATE TASK TYPE
    -------------------------------------------------------- */

    if (task.order_id) {
      const duplicate = await Task.findOne({
        where: {
          shop_id: shopId,

          order_id: task.order_id,

          task_type: task.task_type,

          employee_id: newEmployeeId,

          id: {
            [Op.ne]: taskId,
          },
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `This ${getTaskLabel(
            task.task_type,
          )} task is already assigned to this employee.`,
        });
      }
    }

    const oldEmployeeName = task.employee?.name || "Unassigned";

    task.employee_id = newEmployeeId;

    /*
     * If a task was pending because previous task
     * wasn't completed, keep it pending.
     *
     * If task is already in_progress, it stays in_progress.
     */
    await task.save();

    /* --------------------------------------------------------
       NEW EMPLOYEE NOTIFICATION
    -------------------------------------------------------- */

    try {
      await createNotification({
        shopId,
        employeeId: newEmployeeId,

        taskId: task.id,

        orderId: task.order_id,

        title: "Task reassigned to you",

        message: `${getTaskLabel(task.task_type)} task${
          task.order_id ? ` for order #${task.order_id}` : ""
        } has been reassigned to you from ${oldEmployeeName}.`,

        type: "task",

        link: `/${shopSlug}/employee/mytask`,
      });
    } catch (notificationError) {
      console.error("Reassign notification error:", notificationError.message);
    }

    /* --------------------------------------------------------
       ADMIN NOTIFICATION
    -------------------------------------------------------- */

    try {
      await notifyShopAdmins(shopId, {
        title: "Task reassigned",

        message: `${getTaskLabel(task.task_type)} task${
          task.order_id ? ` for order #${task.order_id}` : ""
        } reassigned from ${oldEmployeeName} to ${newEmployee.name}.`,

        type: "task",

        link: "/admin/tasks",
      });
    } catch (notificationError) {
      console.error(
        "Admin reassign notification error:",
        notificationError.message,
      );
    }

    /* --------------------------------------------------------
       RETURN UPDATED TASK
    -------------------------------------------------------- */

    const updated = await Task.findOne({
      where: {
        id: taskId,
        shop_id: shopId,
      },

      include: [
        {
          model: Employee,
          as: "employee",

          attributes: ["id", "name", "email", "designation", "shop_id"],
        },

        {
          model: Order,
          as: "order",

          attributes: ["id", "status", "shop_id"],

          required: false,
        },
      ],
    });

    return res.status(200).json({
      success: true,

      message: `${getTaskLabel(
        task.task_type,
      )} reassigned to ${newEmployee.name}.`,

      data: updated,
    });
  } catch (error) {
    console.error("Reassign Task Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   ADMIN — TASK HISTORY
   GET /api/tasks/history
============================================================ */

export const getAdminTaskHistory = async (req, res) => {
  try {
    const shopId = requireShop(req, res);

    if (!shopId) return;

    const {
      employee_id,
      customer,
      order_id,
      task_type,
      status,
      startDate,
      endDate,
    } = req.query;

    const where = {
      shop_id: shopId,
    };

    if (employee_id) {
      where.employee_id = Number(employee_id);
    }

    if (order_id) {
      where.order_id = Number(order_id);
    }

    if (task_type) {
      if (!isValidTaskType(task_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task_type.",
        });
      }

      where.task_type = task_type;
    }

    if (status) {
      where.status = status;
    }

    if (customer && String(customer).trim()) {
      where.customer_name = {
        [Op.like]: `%${String(customer).trim()}%`,
      };
    }

    if (startDate && endDate) {
      where.scheduled_time = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),

          new Date(`${endDate}T23:59:59`),
        ],
      };
    } else if (startDate) {
      where.scheduled_time = {
        [Op.gte]: new Date(`${startDate}T00:00:00`),
      };
    } else if (endDate) {
      where.scheduled_time = {
        [Op.lte]: new Date(`${endDate}T23:59:59`),
      };
    }

    const tasks = await Task.findAll({
      where,

      include: [
        {
          model: Employee,
          as: "employee",

          attributes: ["id", "name", "email", "designation", "shop_id"],
        },

        {
          model: Order,
          as: "order",

          attributes: ["id", "status", "total_amount", "shop_id"],

          required: false,

          include: [
            {
              model: Customer,
              as: "customer",

              attributes: ["id", "name", "phone", "shopId"],

              required: false,
            },
          ],
        },
      ],

      order: [
        ["sequence", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get Admin Task History Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — TASK HISTORY
   GET /api/tasks/my-history
============================================================ */

export const getEmployeeTaskHistory = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const { status, task_type, startDate, endDate } = req.query;

    const where = {
      shop_id: shopId,
      employee_id: employeeId,
    };

    if (status) {
      where.status = status;
    }

    if (task_type) {
      if (!isValidTaskType(task_type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task_type.",
        });
      }

      where.task_type = task_type;
    }

    if (startDate && endDate) {
      where.scheduled_time = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),

          new Date(`${endDate}T23:59:59`),
        ],
      };
    } else if (startDate) {
      where.scheduled_time = {
        [Op.gte]: new Date(`${startDate}T00:00:00`),
      };
    } else if (endDate) {
      where.scheduled_time = {
        [Op.lte]: new Date(`${endDate}T23:59:59`),
      };
    }

    const tasks = await Task.findAll({
      where,

      include: [
        {
          model: Order,
          as: "order",

          attributes: [
            "id",
            "status",
            "total_amount",
            "shop_id",
            "pickup_address",
            "delivery_address",
          ],

          required: false,

          include: [
            {
              model: Customer,
              as: "customer",

              attributes: ["id", "name", "phone", "address", "city", "shopId"],

              required: false,
            },
          ],
        },
      ],

      order: [
        ["sequence", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Get Employee Task History Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ============================================================
   EMPLOYEE — CUSTOMER TASKS
   GET /api/tasks/my-customer-tasks
============================================================ */

export const getMyCustomerTasks = async (req, res) => {
  try {
    const context = requireEmployeeContext(req, res);

    if (!context) return;

    const { shopId, employeeId } = context;

    const tasks = await Task.findAll({
      where: {
        shop_id: shopId,
        employee_id: employeeId,
      },

      include: [
        {
          model: Order,
          as: "order",

          attributes: ["id", "status", "total_amount", "shop_id"],

          required: false,

          include: [
            {
              model: Customer,
              as: "customer",

              attributes: ["id", "name", "phone", "address", "city", "shopId"],

              required: false,
            },
          ],
        },
      ],

      order: [
        ["sequence", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    const grouped = {};

    for (const task of tasks) {
      const key = task.customer_name || "Unknown";

      if (!grouped[key]) {
        grouped[key] = {
          customerName: key,

          customerPhone:
            task.customer_phone || task.order?.customer?.phone || null,

          customerAddress:
            task.customer_address || task.order?.customer?.address || null,

          customerCity: task.order?.customer?.city || null,

          tasks: [],
        };
      }

      grouped[key].tasks.push(task);
    }

    return res.status(200).json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error("Get My Customer Tasks Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
