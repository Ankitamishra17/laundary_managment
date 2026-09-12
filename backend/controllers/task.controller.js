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

const TASK_TYPES = [
  "pickup",
  "wash",
  "dry",
  "iron",
  "pack",
  "delivery",
];

const TASK_SEQUENCE = [
  "pickup",
  "wash",
  "dry",
  "iron",
  "pack",
  "delivery",
];

const TASK_SEQUENCE_MAP = {
  pickup: 1,
  wash: 2,
  dry: 3,
  iron: 4,
  pack: 5,
  delivery: 6,
};

const TASK_TYPE_LABELS = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry Cleaning",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

// Validate a task type value coming from query/body.
function isValidTaskType(type) {
  return TASK_TYPES.includes(type);
}

/**
 * Tenant scope helper — builds the `where` clause for admin task listings.
 * Shop admins (req.user.shopId set) only ever see their own shop's tasks,
 * scoped through the assigned employee's shop_id. Super admins (no shopId)
 * see every shop's tasks.
 */
function buildTaskWhereForAdmin(req) {
  const where = {};

  if (req.user?.shopId) {
    where["$employee.shop_id$"] = {
      [Op.or]: [req.user.shopId, null],
    };
  }

  return where;
}


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



// The order status implied by a task's type + status. Returns null when
// the change shouldn't touch the order (e.g. a task reset to pending).
// Maps to the project's existing order statuses:
//   pickup started     → picked_up
//   pickup completed   → processing  (washing stage)
//   wash/iron completed → ready_for_delivery
//   delivery started   → out_for_delivery
//   delivery completed → delivered
function impliedOrderStatus(taskType, taskStatus) {
  if (taskStatus === "pending") return null;
  switch (taskType) {
    case "pickup":
      return taskStatus === "completed" ? "processing" : "picked_up";
    case "wash":
    case "dry":
    case "iron":
    case "pack":
      return taskStatus === "completed" ? "ready_for_delivery" : "processing";
    case "delivery":
      return taskStatus === "completed" ? "delivered" : "out_for_delivery";
    default:
      return null;
  }
}

// Find all tasks for an order so we can validate that previous tasks
// are completed before the current one can advance.
async function getOrderTasksSorted(orderId) {
  return Task.findAll({ where: { order_id: orderId } });
}

// When an order has multiple tasks of the same type (e.g. after a
// re-delivery), we only care about the LATEST one for sequence
// validation.  This map returns { taskType → latestTask }.
function latestTasksByType(allOrderTasks) {
  const map = {};

  for (const task of allOrderTasks) {
    if (
      !map[task.task_type] ||
      Number(task.id) > Number(map[task.task_type].id)
    ) {
      map[task.task_type] = task;
    }
  }

  return map;
}

// Check whether every task type BEFORE `taskType` in the sequence
// has its latest instance completed.  If a type has no tasks at all
// it is considered "clear" (the admin simply hasn't created it yet).
function previousTasksCompleted(taskType, allOrderTasks) {
  const idx = TASK_SEQUENCE.indexOf(taskType);
  const latest = latestTasksByType(allOrderTasks);
  return TASK_SEQUENCE
    .slice(0, idx)
    .every((type) => !latest[type] || latest[type].status === "completed");
}

// Find the next task type in sequence whose latest instance hasn't
// been completed yet.
function findNextTask(currentType, allOrderTasks) {
  const idx = TASK_SEQUENCE.indexOf(currentType);
  const latest = latestTasksByType(allOrderTasks);
  for (const type of TASK_SEQUENCE.slice(idx + 1)) {
    if (latest[type] && latest[type].status !== "completed") {
      return latest[type];
    }
  }

  return null;
}

/* ============================================================
   NEW: Handles the `tasks: [{ task_type, employee_id,
   scheduled_time, priority }]` format sent by the Assign Tasks
   modal, where every task row can go to a DIFFERENT employee at
   a DIFFERENT time. This is what fixes the
   "employee_id and scheduled_time are required" error — the old
   code only ever looked at req.body.employee_id /
   req.body.scheduled_time (top level), which the modal never
   sends.
============================================================ */
async function assignMultipleTasks(req, res, { order_id, customer_name, customer_phone, customer_address, notes, tasks }) {
  // ---- Per-row validation ----
  for (const t of tasks) {
    if (!t.task_type || !TASK_TYPES.includes(t.task_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid task_type: ${t.task_type}`,
      });
    }
    if (!t.employee_id || !t.scheduled_time) {
      return res.status(400).json({
        success: false,
        message: `employee_id and scheduled_time are required for ${TASK_TYPE_LABELS[t.task_type] || t.task_type}`,
      });
    }
    if (new Date(t.scheduled_time) < new Date()) {
      return res.status(400).json({
        success: false,
        message: `Scheduled time for ${TASK_TYPE_LABELS[t.task_type] || t.task_type} cannot be in the past.`,
      });
    }
    if (t.priority && !["normal", "urgent"].includes(t.priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority for ${TASK_TYPE_LABELS[t.task_type] || t.task_type}.`,
      });
    }
  }

  const adminShopId = req.user.shopId || null;

  let resolvedOrderId = order_id ? Number(order_id) : null;
  let resolvedName = String(customer_name || "").trim();
  let resolvedPhone = String(customer_phone || "").trim() || null;
  let resolvedAddress = String(customer_address || "").trim() || null;
  let order = null;

  if (resolvedOrderId) {
    const orderWhere = { id: resolvedOrderId };
    if (adminShopId) orderWhere.shop_id = adminShopId;

    order = await Order.findOne({
      where: orderWhere,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["name", "phone", "address", "city"],
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

    resolvedOrderId = order.id;

    // Business rule: Same Order + Same Task + Same Employee = BLOCKED
    const existingTasks = await Task.findAll({
      where: { order_id: resolvedOrderId },
      attributes: ["task_type", "employee_id"],
    });

    const empDuplicates = tasks.filter((t) =>
      existingTasks.some(
        (et) => et.task_type === t.task_type && et.employee_id === Number(t.employee_id)
      )
    );
    if (empDuplicates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `This task is already assigned to this employee: ${empDuplicates
          .map((t) => TASK_TYPE_LABELS[t.task_type] || t.task_type)
          .join(", ")}. Assign a different task type or a different employee.`,
      });
    }

    // Record the first assigned employee on the order only when no
    // employee is set yet.
    if (!order.employee_id) {
      order.employee_id = Number(tasks[0].employee_id);
      await order.save();
    }

    if (!resolvedName) {
      resolvedName =
        order.customer?.name ||
        String(order.pickup_address || "").trim() ||
        `Order #${order.id}`;
    }
    if (!resolvedPhone) resolvedPhone = order.customer?.phone || null;
    if (!resolvedAddress) {
      resolvedAddress =
        String(
          order.customer
            ? [order.customer.address, order.customer.city].filter(Boolean).join(", ")
            : ""
        ).trim() ||
        order.pickup_address ||
        null;
    }
  }

  if (!resolvedName) {
    return res.status(400).json({
      success: false,
      message: "customer_name is required (or link the task to an order).",
    });
  }

  // ---- Create one task per row, each with its own employee/time ----
  const createdTasks = [];

  for (const t of tasks) {
    const employee = await Employee.findByPk(t.employee_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee not found for ${TASK_TYPE_LABELS[t.task_type] || t.task_type}`,
      });
    }

    if (req.user.shopId && employee.shop_id && employee.shop_id !== req.user.shopId) {
      return res.status(403).json({
        success: false,
        message: "You can only assign tasks to employees of your shop.",
      });
    }

    const task = await Task.create({
      shop_id: adminShopId || employee.shop_id,
      order_id: resolvedOrderId,
      employee_id: Number(t.employee_id),
      customer_name: resolvedName,
      customer_phone: resolvedPhone,
      customer_address: resolvedAddress,
      task_type: t.task_type,
      sequence: TASK_SEQUENCE_MAP[t.task_type] || 1,
      scheduled_time: t.scheduled_time,
      priority: t.priority || "normal",
      status: "pending",
      notes: notes || null,
    });

    const created = await Task.findByPk(task.id, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "email", "designation"],
        },
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount"],
          required: false,
        },
      ],
    });
    createdTasks.push(created);

    const scheduledLabel = new Date(t.scheduled_time).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    await createNotification({
      employeeId: Number(t.employee_id),
      orderId: resolvedOrderId,
      title: "New task assigned",
      message: `${TASK_TYPE_LABELS[t.task_type] || t.task_type} task for ${resolvedName}${
        resolvedOrderId ? ` (order #${resolvedOrderId})` : ""
      } starting ${scheduledLabel}.`,
      type: "task",
      link: "/employee/mytask",
    });
  }

  // Notify the customer about the assignment.
  if (resolvedOrderId) {
    try {
      const orderWithCustomer = await Order.findByPk(resolvedOrderId, {
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "userId", "name"],
            required: false,
          },
        ],
      });
      if (orderWithCustomer?.customer) {
        await notifyCustomer(orderWithCustomer.customer, {
          title: "Task assigned to your order",
          message: `${tasks.length > 1 ? "Tasks have" : "A task has"} been assigned for your order #${resolvedOrderId}.`,
          type: "task",
          orderId: resolvedOrderId,
          link: `/customer/orders/${resolvedOrderId}`,
        });
      }
    } catch (notifErr) {
      console.error("Customer notification error:", notifErr.message);
    }
  }

  return res.status(201).json({
    success: true,
    message:
      createdTasks.length > 1
        ? `${createdTasks.length} tasks created successfully`
        : "Task assigned successfully",
    data: createdTasks.length === 1 ? createdTasks[0] : createdTasks,
  });
}

// ============================================================
// Admin side
// ============================================================

// GET /api/tasks?employee_id=&status=&task_type= — Admin lists all tasks
export const getAllTasks = async (req, res) => {
  try {
    const { employee_id, order_id, status, task_type } = req.query;

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
          attributes: ["id", "name", "email", "designation", "shop_id", "status"],
        },

        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount", "pickup_address", "delivery_address"],
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

// POST /api/tasks — Admin assigns tasks to an employee
// Body (single-employee / single-time form):
//   { order_id?, employee_id, customer_name?, customer_phone?,
//     customer_address?, task_type?, task_types?: string[],
//     scheduled_time, priority?, notes? }
//   task_types is an array — one task is created per selected type,
//   all going to the SAME employee, spaced 30 min apart.
//
// Body (NEW per-task form used by the Assign Tasks modal):
//   { order_id?, customer_name?, customer_phone?, customer_address?,
//     notes?, tasks: [{ task_type, employee_id, scheduled_time, priority }] }
//   Each task can have a DIFFERENT employee and a DIFFERENT time.
export const assignTask = async (req, res) => {
  try {
    const {
      order_id,
      employee_id,
      customer_name,
      customer_phone,
      customer_address,
      task_type,
      task_types,
      tasks, // NEW: [{ task_type, employee_id, scheduled_time, priority }]
      scheduled_time,
      priority,
      notes,
    } = req.body;

    // ---- NEW: per-task employee/time assignment (what the modal sends) ----
    if (Array.isArray(tasks) && tasks.length > 0) {
      return await assignMultipleTasks(req, res, {
        order_id,
        customer_name,
        customer_phone,
        customer_address,
        notes,
        tasks,
      });
    }
    // -------------------------------------------------------------------

    if (!employee_id || !scheduled_time) {
      return res.status(400).json({
        success: false,
        message: "employee_id and scheduled_time are required",
      });
    }

    // Reject past scheduled times
    if (new Date(scheduled_time) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time cannot be in the past.",
      });
    }

    // Build the list of task types to create.
    // Priority: task_types array > task_type string > auto from order.
    let typesToCreate = [];
    if (Array.isArray(task_types) && task_types.length > 0) {
      // Validate each provided type
      for (const t of task_types) {
        if (!TASK_TYPES.includes(t)) {
          return res.status(400).json({ success: false, message: `Invalid task_type: ${t}` });
        }
      }
      typesToCreate = [...new Set(task_types)]; // deduplicate
    } else if (task_type) {
      if (!TASK_TYPES.includes(task_type)) {
        return res.status(400).json({ success: false, message: "Invalid task_type" });
      }
      typesToCreate = [task_type];
    } else {
      return res.status(400).json({
        success: false,
        message: "Provide task_type (single) or task_types (array).",
      });
    }

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // The employee must belong to the admin's own shop — unless it's a
    // legacy employee record that was never linked to a shop.
    if (req.user.shopId && employee.shop_id && employee.shop_id !== req.user.shopId) {
      return res.status(403).json({
        success: false,
        message: "You can only assign tasks to employees of your shop.",
      });
    }

    // Tenant scope for order lookups — shop admins are restricted to their
    // own shop; super admins (no shopId) can address any shop.
    const adminShopId = req.user.shopId || null;

    // Resolve order context when the admin assigns from an order.
    let resolvedOrderId = order_id ? Number(order_id) : null;
    let resolvedName = String(customer_name || "").trim();
    let resolvedPhone = String(customer_phone || "").trim() || null;
    let resolvedAddress = String(customer_address || "").trim() || null;

    if (resolvedOrderId) {
      const orderWhere = { id: resolvedOrderId };

      // Only scope by shop when the caller is a shop admin. A super admin
      // has no shopId, and `shop_id: null` would match nothing.
      if (adminShopId) {
        orderWhere.shop_id = adminShopId;
      }

      const order = await Order.findOne({
        where: orderWhere,

        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["name", "phone", "address", "city"],
            required: false,
          },
        ],
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found in your shop.",
        });
      }

      // Cannot assign tasks to a delivered or cancelled order
      if (order.status === "delivered" || order.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message:
            `Cannot assign tasks to a ${order.status} order.`,
        });
      }

      resolvedOrderId = order.id;

      // Check for duplicate task assignments.
      // Business rule: Same Order + Same Task + Same Employee = BLOCKED
      // But: Same Order + Different Task + Different Employee = ALLOWED
      if (typesToCreate.length > 0) {
        const existingTasks = await Task.findAll({
          where: { order_id: resolvedOrderId },
          attributes: ["task_type", "employee_id"],
        });

        // Check if this specific employee already has any of the requested task types
        const empDuplicates = typesToCreate.filter((t) =>
          existingTasks.some(
            (et) => et.task_type === t && et.employee_id === Number(employee_id)
          )
        );
        if (empDuplicates.length > 0) {
          return res.status(400).json({
            success: false,
            message: `This task is already assigned to this employee: ${empDuplicates.map((t) => TASK_TYPE_LABELS[t] || t).join(", ")}. Assign a different task type or a different employee.`,
          });
        }
      }

      // Record the assigned employee on the order only when no employee
      // is set yet — different employees may handle different tasks for
      // the same order (e.g. one picks up, another delivers).
      if (!order.employee_id) {
        order.employee_id = Number(employee_id);
        await order.save();
      }

      // Auto-fill customer details from the order when not supplied manually.
      if (!resolvedName) {
        resolvedName =
          order.customer?.name ||
          String(order.pickup_address || "").trim() ||
          `Order #${order.id}`;
      }
      if (!resolvedPhone) resolvedPhone = order.customer?.phone || null;
      if (!resolvedAddress) {
        resolvedAddress =
          String(order.customer ? [order.customer.address, order.customer.city].filter(Boolean).join(", ") : "").trim() ||
          order.pickup_address ||
          null;
      }
    }

    // --------------------------------------------------------
    // CUSTOMER REQUIRED FOR NON-ORDER TASK
    // --------------------------------------------------------

    if (!resolvedName) {
      return res.status(400).json({
        success: false,
        message: "customer_name is required (or link the task to an order).",
      });
    }

    // Create one task per selected type. Each type is spaced 30 min
    // apart so the employee progresses through the workflow sequentially.
    const baseTime = new Date(scheduled_time);
    const createdTasks = [];

    for (let i = 0; i < typesToCreate.length; i++) {
      const tType = typesToCreate[i];
      const spacedTime = new Date(baseTime.getTime() + i * 30 * 60 * 1000);

      const task = await Task.create({
        // Tenant column — every task row is stamped with a shop. Shop
        // admins stamp their own shop; a super admin's task inherits the
        // assigned employee's shop (tasks.shop_id is NOT NULL).
        shop_id: adminShopId || employee.shop_id,
        order_id: resolvedOrderId,
        employee_id,
        customer_name: resolvedName,
        customer_phone: resolvedPhone,
        customer_address: resolvedAddress,
        task_type: tType,
        sequence: TASK_SEQUENCE_MAP[tType] || 1,
        scheduled_time: typesToCreate.length > 1 ? spacedTime : baseTime,
        priority: priority || "normal",
        status: "pending",
        notes: notes || null,
      });

      const created = await Task.findByPk(task.id, {
        include: [
          {
            model: Employee,
            as: "employee",
            attributes: ["id", "name", "email", "designation"],
          },
          {
            model: Order,
            as: "order",
            attributes: ["id", "status", "total_amount"],
            required: false,
          },
        ],
      });
      createdTasks.push(created);
    }

    // Notify the employee about the full task chain.
    const scheduledLabel = scheduled_time
      ? new Date(scheduled_time).toLocaleString([], {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const taskSummary = typesToCreate.length > 1
      ? `Tasks (${typesToCreate.map((t) => TASK_TYPE_LABELS[t] || t).join(", ")}) for ${resolvedName}${resolvedOrderId ? ` (order #${resolvedOrderId})` : ""}`
      : `${TASK_TYPE_LABELS[typesToCreate[0]] || typesToCreate[0]} task for ${resolvedName}${resolvedOrderId ? ` (order #${resolvedOrderId})` : ""}`;
    await createNotification({
      employeeId: Number(employee_id),
      orderId: resolvedOrderId,
      title: typesToCreate.length > 1 ? "Multiple tasks assigned" : "New task assigned",
      message: `${taskSummary} starting ${scheduledLabel}.`,
      type: "task",
      link: "/employee/mytask",
    });

    // Notify the customer about the task assignment on their order.
    if (resolvedOrderId) {
      try {
        const orderWithCustomer = await Order.findByPk(resolvedOrderId, {
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "userId", "name"],
              required: false,
            },
          ],
        });
        if (orderWithCustomer?.customer) {
          await notifyCustomer(orderWithCustomer.customer, {
            title: "Task assigned to your order",
            message: `A ${typesToCreate.length > 1 ? typesToCreate.map((t) => TASK_TYPE_LABELS[t] || t).join(", ") : TASK_TYPE_LABELS[typesToCreate[0]] || typesToCreate[0]} task has been assigned for your order #${resolvedOrderId}.`,
            type: "task",
            orderId: resolvedOrderId,
            link: `/customer/orders/${resolvedOrderId}`,
          });
        }
      } catch (notifErr) {
        // Non-critical — don't fail the request if customer notification fails
        console.error("Customer notification error:", notifErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: createdTasks.length > 1
        ? `${createdTasks.length} tasks created successfully`
        : "Task assigned successfully",
      data: createdTasks.length === 1 ? createdTasks[0] : createdTasks,
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ success: false, message: error.errors?.[0]?.message || error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   EMPLOYEE — MY TASKS
   GET /api/tasks/my-tasks
============================================================ */

export const getMyTasks = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status, type, date } = req.query;

    // Tenant scope: the employee's own shop (req.user.shopId is set by the
    // auth middleware from the employee record's shop_id).
    const shopId = req.user.shopId;

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
      where.scheduled_time = { [Op.between]: [start, end] };
    }

    const tasks = await Task.findAll({
      where,

      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount", "pickup_address", "delivery_address"],
          required: false,
        },
      ],

      order: [
        [literal("CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END"), "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/my-tasks/stats?date=2026-05-24
export const getMyTaskStats = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { date } = req.query;

    // Tenant scope: same as getMyTasks — employee's own shop.
    const shopId = req.user.shopId;

    const where = {
      shop_id: shopId,
      employee_id: employeeId,
    };

    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      where.scheduled_time = { [Op.between]: [start, end] };
    }

    const [
      total,
      pending,
      inProgress,
      completed,
    ] = await Promise.all([
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, employee_id: req.user.id },
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount", "pickup_address", "delivery_address", "pickup_date", "pickup_time", "delivery_date", "delivery_note"],
          required: false,
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "userId", "name", "email", "phone", "address", "city"],
              required: false,
            },
          ],
        },
      ],
    });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/:id/status   { "status": "in_progress" | "completed" }
// Enforces sequential task completion per order and auto-activates the
// next task when the current one is completed (for the same employee).
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "in_progress", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    /* --------------------------------------------------------
       GET TASK
    -------------------------------------------------------- */

    const task = await Task.findOne({
      where: { id: req.params.id, employee_id: req.user.id },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "shop_id"],
        },
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "shop_id", "delivery_time", "customer_id"],
          required: false,
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "userId", "name"],
              required: false,
            },
          ],
        },
      ],
    });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    // --- SEQUENCE VALIDATION -------------------------------------------
    // For tasks linked to an order, enforce that all previous tasks in the
    // sequence are completed before this one can advance (start or complete).
    let allOrderTasks = null;
    if (task.order_id && (status === "in_progress" || status === "completed")) {
      allOrderTasks = await getOrderTasksSorted(task.order_id);

      if (!previousTasksCompleted(task.task_type, allOrderTasks)) {
        const blocking = allOrderTasks
          .filter((t) => TASK_SEQUENCE.indexOf(t.task_type) < TASK_SEQUENCE.indexOf(task.task_type) && t.status !== "completed")
          .map((t) => TASK_TYPE_LABELS[t.task_type] || t.task_type);
        return res.status(400).json({
          success: false,
          message: `Cannot start this task yet. Complete these first: ${blocking.join(", ")}.`,
        });
      }
    }

    // --- ONE ACTIVE TASK RULE ----------------------------------------
    // An employee can have only ONE in_progress task at a time.  If the
    // employee is starting a new task, any existing in_progress task is
    // auto-paused back to "pending" (preserving started_at so it can be
    // resumed later).  Urgent tasks always take priority — if the
    // currently-active task is normal, it will be paused automatically.
    if (status === "in_progress") {
      const existingActive = await Task.findOne({
        where: {
          employee_id: req.user.id,
          status: "in_progress",
          id: { [Op.ne]: task.id },
        },
      });
      if (existingActive) {
        existingActive.status = "pending";
        await existingActive.save();
        // Notify the employee that their task was paused
        const pausedLabel = TASK_TYPE_LABELS[existingActive.task_type] || existingActive.task_type;
        const newLabel = TASK_TYPE_LABELS[task.task_type] || task.task_type;
        await createNotification({
          employeeId: req.user.id,
          taskId: existingActive.id,
          orderId: existingActive.order_id,
          title: `Task paused: ${pausedLabel}`,
          message: `Your ${pausedLabel} task has been paused so you can work on the ${newLabel} task. You can resume it later.`,
          type: "task",
          link: "/employee/mytask",
        });
      }
    }

    // Track lifecycle timestamps
    if (status === "in_progress" && !task.started_at) {
      task.started_at = new Date();
    }
    if (status === "completed" && !task.completed_at) {
      task.completed_at = new Date();
    }

    task.status = status;

    await task.save();

    // --- AUTO-ACTIVATE NEXT TASK ---------------------------------------
    // When a task is completed, automatically start the next task in the
    // sequence IF it is assigned to the same employee.  If it belongs to
    // a different employee, leave it pending — they will start it on their
    // own dashboard.
    if (status === "completed" && task.order_id) {
      if (!allOrderTasks) allOrderTasks = await getOrderTasksSorted(task.order_id);
      const next = findNextTask(task.task_type, allOrderTasks);
      if (next && next.employee_id === task.employee_id && next.status === "pending") {
        next.status = "in_progress";
        await next.save();
      }
    }

    // --- ORDER STATUS UPDATE -------------------------------------------
    // Propagate the progress to the linked order so the admin's order list
    // and the customer's tracking view stay in sync with the employee's work.
    // Reload the order fresh to avoid stale Sequelize include issues.
    let freshOrder = null;

    if (task.order_id) {
      freshOrder = await Order.findByPk(task.order_id, {
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
    const previousOrderStatus = freshOrder?.status || task.order?.status;

    if (freshOrder && freshOrder.status !== "cancelled") {
      const implied = impliedOrderStatus(task.task_type, status);
      const currentRank = ORDER_STATUS_RANK[freshOrder.status] ?? -1;
      if (implied && (ORDER_STATUS_RANK[implied] ?? 0) > currentRank) {
        freshOrder.status = implied;
        if (implied === "delivered") freshOrder.delivery_time = new Date().toISOString();
        await freshOrder.save();
      }
    }

    // --- NOTIFICATIONS ------------------------------------------------
    // Resolve the next task and its employee (used by multiple sections)
    let nextTask = null;
    let nextEmployee = null;
    if (status === "completed" && task.order_id) {
      if (!allOrderTasks) allOrderTasks = await getOrderTasksSorted(task.order_id);
      nextTask = findNextTask(task.task_type, allOrderTasks);
      if (nextTask && nextTask.employee_id) {
        nextEmployee = await Employee.findByPk(nextTask.employee_id, {
          attributes: ["id", "name"],
        }).catch(() => null);
      }
    }

    const shopIdForAdmin = task.employee?.shop_id || freshOrder?.shop_id || task.order?.shop_id;
    const typeLabel = TASK_TYPE_LABELS[task.task_type] || task.task_type;
    const orderId = task.order?.id || task.order_id;
    const customerName = task.customer_name || task.order?.customer?.name || "the customer";
    const newOrderStatus = freshOrder?.status || task.order?.status;
    const orderStatusChanged = previousOrderStatus !== newOrderStatus && newOrderStatus;

    // 1) Notify the shop admin — comprehensive update
    if (status === "completed") {
      // Build a detailed admin notification about the completed task
      let adminMessage = `${task.employee?.name || "An employee"} completed the ${typeLabel} task for ${customerName}'s Order #${orderId}.`;

      // Include next assigned employee info
      if (nextTask && nextEmployee) {
        const nextLabel = TASK_TYPE_LABELS[nextTask.task_type] || nextTask.task_type;
        if (nextEmployee.id === task.employee_id) {
          adminMessage += ` Next task (${nextLabel}) auto-activated for the same employee.`;
        } else {
          adminMessage += ` Next task (${nextLabel}) assigned to ${nextEmployee.name}.`;
        }
      } else if (task.task_type === "delivery") {
        adminMessage += ` Order is now delivered!`;
      } else if (task.task_type !== "pickup") {
        adminMessage += ` Order is ready for delivery — assign a delivery employee.`;
      }

      // Include order status change info
      if (orderStatusChanged) {
        adminMessage += ` Order status: ${ORDER_STATUS_LABELS[previousOrderStatus] || previousOrderStatus} → ${ORDER_STATUS_LABELS[newOrderStatus] || newOrderStatus}.`;
      }

      await notifyShopAdmins(shopIdForAdmin, {
        title: `Task completed: ${typeLabel}`,
        message: adminMessage,
        type: "task",
        orderId: orderId,
        link: "/admin/tasks",
      });
    } else {
      // For in_progress or other status changes, send a simpler notification
      const doneWord = status === "in_progress" ? "started" : "updated";
      await notifyShopAdmins(shopIdForAdmin, {
        title: "Task update from employee",
        message: `${task.employee?.name || "An employee"} ${doneWord} the ${typeLabel} task for Order #${orderId}.${
          orderStatusChanged
            ? ` Order status: ${ORDER_STATUS_LABELS[previousOrderStatus] || previousOrderStatus} → ${ORDER_STATUS_LABELS[newOrderStatus] || newOrderStatus}.`
            : ""
        }`,
        type: "task",
        orderId: orderId,
        link: "/admin/tasks",
      });
    }

    // 2) Notify the next assigned employee — so they know their task is ready
    if (status === "completed" && nextTask) {
      const completedLabel = TASK_TYPE_LABELS[task.task_type] || task.task_type;
      const nextLabel = TASK_TYPE_LABELS[nextTask.task_type] || nextTask.task_type;

      if (nextTask.employee_id !== task.employee_id) {
        // Different employee — they need to start the task themselves
        await createNotification({
          employeeId: nextTask.employee_id,
          taskId: nextTask.id,
          orderId: orderId,
          title: `${completedLabel} done — your ${nextLabel} is ready`,
          message: `${task.employee?.name || "An employee"} completed ${completedLabel} for ${customerName}'s Order #${orderId}. Your ${nextLabel} task is ready to start.`,
          type: "task",
          link: "/employee/mytask",
        });
      } else if (nextTask.status === "in_progress") {
        // Same employee — auto-activated, notify so bell badge updates
        await createNotification({
          employeeId: nextTask.employee_id,
          taskId: nextTask.id,
          orderId: orderId,
          title: `${completedLabel} done — next: ${nextLabel}`,
          message: `Your ${completedLabel.toLowerCase()} task for ${customerName}'s Order #${orderId} is completed. Your next task is ${nextLabel} — it's ready to go.`,
          type: "task",
          link: "/employee/mytask",
        });
      }
    }

    // 3) Notify the customer about order status changes
    const effectiveOrder = freshOrder || task.order;
    if (effectiveOrder) {
      const orderStatus = effectiveOrder.status;
      const customerObj = effectiveOrder.customer || null;

      // When delivery task is completed, always send the review prompt
      if (task.task_type === "delivery" && status === "completed") {
        await notifyCustomer(customerObj, {
          title: "Order delivered — Review us!",
          message: `Your order #${orderId} has been delivered! We'd love your feedback — write a review to share your experience.`,
          type: "order",
          orderId: orderId,
          link: "/customer/reviews",
        });
      } else if (orderStatusChanged) {
        await notifyCustomer(customerObj, {
          title: "Order status updated",
          message: `Your order #${orderId} is now ${ORDER_STATUS_LABELS[orderStatus] || orderStatus}.`,
          type: "order",
          orderId: orderId,
          link: `/customer/orders/${orderId}`,
        });
      }
    }

    return res.status(200).json({ success: true, data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/:id/notes   { "notes": "..." }
export const updateTaskNotes = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, employee_id: req.user.id },
    });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.notes = req.body.notes ?? task.notes;
    await task.save();

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Admin — task assignment helpers
// ============================================================

// GET /api/tasks/order/:orderId — Admin gets all tasks for an order
export const getOrderTasks = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    // Scope: if admin has a shopId, the order must belong to that shop
    const orderWhere = { id: orderId };
    if (req.user.shopId) orderWhere.shop_id = req.user.shopId;

    const order = await Order.findOne({ where: orderWhere });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const tasks = await Task.findAll({
      where: { order_id: orderId },
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "email", "designation"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/tasks/:id/reassign — Admin reassigns a task to another employee
// Body: { employee_id }
// Moves the task to the new employee without creating duplicates.
export const reassignTask = async (req, res) => {
  try {
    const { employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({ success: false, message: "employee_id is required" });
    }

    const taskId = Number(req.params.id);

    // Find the task — scoped to admin's shop
    const taskWhere = { id: taskId };
    const task = await Task.findByPk(taskId, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "shop_id"],
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
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Verify admin can access this task (shop scoping)
    const taskShopId = task.employee?.shop_id || task.order?.shop_id;
    if (req.user.shopId && taskShopId && taskShopId !== req.user.shopId) {
      return res.status(403).json({ success: false, message: "Cannot reassign tasks from another shop." });
    }

    // Cannot reassign a completed task
    if (task.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot reassign a completed task.",
      });
    }

    // Find the new employee
    const newEmployee = await Employee.findByPk(employee_id);
    if (!newEmployee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // New employee must belong to the same shop (unless legacy/no shop)
    if (req.user.shopId && newEmployee.shop_id && newEmployee.shop_id !== req.user.shopId) {
      return res.status(403).json({
        success: false,
        message: "Cannot assign to an employee from a different shop.",
      });
    }

    // Prevent duplicate: check if this order already has the same task_type
    // assigned to someone else (which would mean a duplicate exists)
    if (task.order_id) {
      const duplicate = await Task.findOne({
        where: {
          order_id: task.order_id,

          task_type: task.task_type,
          id: { [Op.ne]: taskId },
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `A ${TASK_TYPE_LABELS[task.task_type]} task already exists for this order. Delete it first or update it.`,
        });
      }
    }

    // If task is in_progress or completed, warn but allow reassignment
    const oldEmployeeName = task.employee?.name || "Unassigned";
    task.employee_id = Number(employee_id);
    await task.save();

    // Notify the new employee
    await createNotification({
      employeeId: Number(employee_id),
      title: "Task reassigned to you",
      message: `${TASK_TYPE_LABELS[task.task_type] || task.task_type} task${task.order_id ? ` for order #${task.order_id}` : ""} has been reassigned to you from ${oldEmployeeName}.`,
      type: "task",
      link: "/employee/mytask",
    });

    // Reload with the new employee info
    const updated = await Task.findByPk(taskId, {
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["id", "name", "email", "designation"],
        },

        {
          model: Order,
          as: "order",
          attributes: ["id", "status"],
          required: false,
        },
      ],
    });

    // --------------------------------------------------------
    // SUCCESS RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: `${TASK_TYPE_LABELS[task.task_type] || task.task_type} reassigned to ${newEmployee.name}`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Admin — Task History
// ============================================================

// GET /api/tasks/history?employee_id=&customer=&order_id=&task_type=&status=&startDate=&endDate=
// Returns complete task activity for the admin to review.
export const getAdminTaskHistory = async (req, res) => {
  try {
    const {
      employee_id,
      customer,
      order_id,
      task_type,
      status,
      startDate,
      endDate,
    } = req.query;

    const where = {};

    // Scope to admin's shop
    if (req.user.shopId) {
      where["$employee.shop_id$"] = {
        [Op.or]: [req.user.shopId, null],
      };
    }

    if (employee_id) where.employee_id = employee_id;
    if (order_id) where.order_id = order_id;
    if (task_type) where.task_type = task_type;
    if (status) where.status = status;

    // Customer name search
    if (customer && String(customer).trim()) {
      where.customer_name = { [Op.like]: `%${String(customer).trim()}%` };
    }

    // Date range filter on scheduled_time
    if (startDate && endDate) {
      where.scheduled_time = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),
          new Date(`${endDate}T23:59:59`),
        ],
      };
    } else if (startDate) {
      where.scheduled_time = { [Op.gte]: new Date(`${startDate}T00:00:00`) };
    } else if (endDate) {
      where.scheduled_time = { [Op.lte]: new Date(`${endDate}T23:59:59`) };
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
          attributes: ["id", "status", "total_amount"],
          required: false,
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "name", "phone"],
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ============================================================
   EMPLOYEE — TASK HISTORY
   GET /api/tasks/my-history
============================================================ */

export const getEmployeeTaskHistory = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status, task_type, startDate, endDate } = req.query;

    const where = { employee_id: employeeId };

    if (status) where.status = status;
    if (task_type) where.task_type = task_type;

    if (startDate && endDate) {
      where.scheduled_time = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),
          new Date(`${endDate}T23:59:59`),
        ],
      };
    } else if (startDate) {
      where.scheduled_time = { [Op.gte]: new Date(`${startDate}T00:00:00`) };
    } else if (endDate) {
      where.scheduled_time = { [Op.lte]: new Date(`${endDate}T23:59:59`) };
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount", "pickup_address", "delivery_address"],
          required: false,
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "name", "phone", "address", "city"],
              required: false,
            },
          ],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Employee — Customer Tasks (for the Customers section)
// ============================================================

// GET /api/tasks/my-customer-tasks
// Returns every task belonging to the logged-in employee, grouped by
// customer_name. Each group includes the customer's tasks with order
// references so the employee can see which tasks they performed for
// which customer and order.
export const getMyCustomerTasks = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const tasks = await Task.findAll({
      where: { employee_id: employeeId },
      include: [
        {
          model: Order,
          as: "order",
          attributes: ["id", "status", "total_amount"],
          required: false,
          include: [
            {
              model: Customer,
              as: "customer",
              attributes: ["id", "name", "phone", "address", "city"],
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const grouped = {};
    for (const t of tasks) {
      const key = t.customer_name || "Unknown";
      if (!grouped[key]) {
        grouped[key] = {
          customerName: key,
          customerPhone: t.customer_phone || t.order?.customer?.phone || null,
          customerAddress: t.customer_address || t.order?.customer?.address || null,
          customerCity: t.order?.customer?.city || null,
          tasks: [],
        };
      }
      grouped[key].tasks.push(t);
    }

    return res.status(200).json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};