import { Op, literal } from "sequelize";
import { Task, Employee, Order, Customer } from "../models/index.js";
import { createNotification, notifyShopAdmins, notifyCustomer } from "./notification.controller.js";

const TASK_TYPES = ["pickup", "wash", "dry", "iron", "pack", "delivery"];

const TASK_TYPE_LABELS = {
  pickup: "Pickup",
  wash: "Wash",
  dry: "Dry Cleaning",
  iron: "Ironing",
  pack: "Packing",
  delivery: "Delivery",
};

// Canonical sequence — determines which tasks must be completed before
// others can start.  The position in the array IS the sequence number.
const TASK_SEQUENCE = ["pickup", "wash", "dry", "iron", "pack", "delivery"];

const ORDER_STATUS_LABELS = {
  pending: "Pending",
  picked_up: "Picked Up",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Order statuses ranked so task progress can only move an order forward,
// never backwards (e.g. a late "wash" task can't reset a delivered order).
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
  for (const t of allOrderTasks) {
    if (!map[t.task_type] || t.id > map[t.task_type].id) {
      map[t.task_type] = t;
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

// ============================================================
// Admin side
// ============================================================

// GET /api/tasks?employee_id=&status=&task_type= — Admin lists all tasks
export const getAllTasks = async (req, res) => {
  try {
    const { employee_id, status, task_type } = req.query;

    const where = {};
    if (employee_id) where.employee_id = employee_id;
    if (status) where.status = status;
    if (task_type) where.task_type = task_type;

    // Scope to the admin's shop: only tasks assigned to employees of this
    // shop. Legacy employees without a shop are included too so old data
    // stays visible. Super admins see everything.
    if (req.user.shopId) {
      where["$employee.shop_id$"] = {
        [Op.or]: [req.user.shopId, null],
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
          attributes: ["id", "status", "total_amount", "pickup_address", "delivery_address"],
          required: false,
        },
      ],
      order: [["scheduled_time", "DESC"]],
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks — Admin assigns tasks to an employee
// Body: { order_id?, employee_id, customer_name?, customer_phone?,
//         customer_address?, task_type?, task_types?: string[],
//         scheduled_time, priority?, notes? }
// task_types is an array — one task is created per selected type.
// When order_id is given and task_types is omitted, defaults to all types.
// When order_id is not given and task_types is omitted, uses task_type.
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
      scheduled_time,
      priority,
      notes,
    } = req.body;

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

    // Resolve order context when the admin assigns from an order.
    let resolvedOrderId = order_id ? Number(order_id) : null;
    let resolvedName = String(customer_name || "").trim();
    let resolvedPhone = String(customer_phone || "").trim() || null;
    let resolvedAddress = String(customer_address || "").trim() || null;

    if (resolvedOrderId) {
      const order = await Order.findOne({
        where: { id: resolvedOrderId, shop_id: req.user.shopId || undefined },
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

      // Cannot assign tasks to a delivered or cancelled order
      if (order.status === "delivered" || order.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: `Cannot assign tasks to a ${order.status} order.`,
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
        order_id: resolvedOrderId,
        employee_id,
        customer_name: resolvedName,
        customer_phone: resolvedPhone,
        customer_address: resolvedAddress,
        task_type: tType,
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

// ============================================================
// Employee side — always scoped to the logged-in employee
// ============================================================

// GET /api/tasks/my-tasks?status=pending&type=pickup&date=2026-05-24
// Tasks are sorted so that urgent tasks always appear before normal ones,
// and within each priority group tasks are ordered by scheduled time.
export const getMyTasks = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status, type, date } = req.query;

    const where = { employee_id: employeeId };
    if (status) where.status = status;
    if (type) where.task_type = type;

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
      // Priority sort: urgent tasks first, then by scheduled_time.
      // Sequelize literal sorts urgent=1 before normal=0.
      order: [
        [literal("CASE WHEN priority = 'urgent' THEN 0 ELSE 1 END"), "ASC"],
        ["scheduled_time", "ASC"],
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

    const where = { employee_id: employeeId };
    if (date) {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      where.scheduled_time = { [Op.between]: [start, end] };
    }

    const [total, pending, inProgress, completed] = await Promise.all([
      Task.count({ where }),
      Task.count({ where: { ...where, status: "pending" } }),
      Task.count({ where: { ...where, status: "in_progress" } }),
      Task.count({ where: { ...where, status: "completed" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: { total, pending, inProgress, completed },
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

    const previousOrderStatus = task.order?.status;

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
    if (task.order && task.order.status !== "cancelled") {
      const implied = impliedOrderStatus(task.task_type, status);
      const currentRank = ORDER_STATUS_RANK[task.order.status] ?? -1;
      if (implied && (ORDER_STATUS_RANK[implied] ?? 0) > currentRank) {
        task.order.status = implied;
        if (implied === "delivered") task.order.delivery_time = new Date();
        await task.order.save();
      }
    }

    // --- NOTIFICATIONS ------------------------------------------------
    // 1) The shop admin
    const shopIdForAdmin = task.employee?.shop_id || task.order?.shop_id;
    const orderRef = task.order ? ` for order #${task.order.id}` : "";
    const doneWord = status === "completed" ? "completed" : status === "in_progress" ? "started" : "updated";
    const typeLabel = TASK_TYPE_LABELS[task.task_type] || task.task_type;
    await notifyShopAdmins(shopIdForAdmin, {
      title: "Task update from employee",
      message: `${task.employee?.name || "An employee"} ${doneWord} the ${typeLabel} task${orderRef}.${
        status === "completed" && task.task_type !== "delivery" && task.task_type !== "pickup"
          ? " Order is ready for delivery — assign a delivery employee."
          : ""
      }`,
      type: "task",
      link: "/admin/tasks",
    });

    // 2) The next assigned employee — so they know their task is ready
    if (status === "completed" && task.order_id) {
      if (!allOrderTasks) allOrderTasks = await getOrderTasksSorted(task.order_id);
      const next = findNextTask(task.task_type, allOrderTasks);
      if (next && next.employee_id && next.employee_id !== task.employee_id) {
        const completedLabel = TASK_TYPE_LABELS[task.task_type] || task.task_type;
        const nextLabel = TASK_TYPE_LABELS[next.task_type] || next.task_type;
        const employeeName = task.employee?.name || "An employee";
        const orderId = task.order?.id || task.order_id;
        const customerName = task.customer_name || task.order?.customer?.name || "the customer";
        await createNotification({
          employeeId: next.employee_id,
          taskId: next.id,
          orderId: orderId,
          title: `${completedLabel} Completed — Your ${nextLabel} is ready`,
          message: `${completedLabel} completed by ${employeeName} for ${customerName}'s Order #${orderId}. Your ${nextLabel} task is ready to start.`,
          type: "task",
          link: "/employee/mytask",
        });
      }
      // Same employee — they got auto-activated, but still notify so the
      // bell badge updates and they see "your next task is ready".
      if (next && next.employee_id === task.employee_id && next.status === "in_progress") {
        const completedLabel = TASK_TYPE_LABELS[task.task_type] || task.task_type;
        const nextLabel = TASK_TYPE_LABELS[next.task_type] || next.task_type;
        const orderId = task.order?.id || task.order_id;
        const customerName = task.customer_name || task.order?.customer?.name || "the customer";
        await createNotification({
          employeeId: next.employee_id,
          taskId: next.id,
          orderId: orderId,
          title: `${completedLabel} Done — Next: ${nextLabel}`,
          message: `Your ${completedLabel.toLowerCase()} task for ${customerName}'s Order #${orderId} is completed. Your next task is ${nextLabel} — it's ready to go.`,
          type: "task",
          link: "/employee/mytask",
        });
      }
    }

    // 3) The customer
    if (task.order && previousOrderStatus !== task.order.status) {
      await notifyCustomer(task.order.customer, {
        title: "Order updated",
        message: `Your order #${task.order.id} is now ${ORDER_STATUS_LABELS[task.order.status] || task.order.status}.`,
        type: "order",
        link: `/customer/orders/${task.order.id}`,
      });
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

    return res.status(200).json({ success: true, data: task });
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
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // Scope: if admin has a shopId, the order must belong to that shop
    const orderWhere = { id: orderId };
    if (req.user.shopId) orderWhere.shop_id = req.user.shopId;

    const order = await Order.findOne({ where: orderWhere });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
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
      order: [["id", "ASC"]],
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
        message: "Cannot reassign a completed task. Only pending or in-progress tasks can be reassigned.",
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
        return res.status(400).json({
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
      order: [["scheduled_time", "DESC"]],
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// Employee — Task History
// ============================================================

// GET /api/tasks/my-history?status=&task_type=&startDate=&endDate=
// Returns all tasks (including completed) for the logged-in employee.
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
        },
      ],
      order: [["scheduled_time", "DESC"]],
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
      order: [["scheduled_time", "DESC"]],
    });

    // Group tasks by customer_name so the UI can display per-customer cards.
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
